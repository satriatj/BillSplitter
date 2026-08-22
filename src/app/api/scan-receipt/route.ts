import { NextResponse } from "next/server";
import {
  normalizeScannedReceipt,
  type RawScannedReceipt,
} from "@/lib/receipt-scan";

export const runtime = "nodejs";

// Tried in order; a model is only abandoned for the next one after it fails
// MAX_ATTEMPTS_PER_MODEL times with a retryable error (429/500/503 — Gemini's
// "high demand" and rate-limit responses). Override the primary via
// GEMINI_MODEL if you want to track Google's latest release without a code
// change; the lite model stays as a fallback since it's cheaper and rarely
// saturated at the same time as the full model.
const GEMINI_MODELS = Array.from(
  new Set([process.env.GEMINI_MODEL || "gemini-3.6-flash", "gemini-3.5-flash-lite"])
);
const MAX_ATTEMPTS_PER_MODEL = 3;
const RETRYABLE_STATUS = new Set([429, 500, 503]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    restaurantName: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "string" },
        },
        required: ["name", "quantity", "unitPrice"],
      },
    },
    subtotal: { type: "string" },
    tax: { type: "string" },
    tip: { type: "string" },
    total: { type: "string" },
  },
  required: ["items"],
};

const PROMPT = `You are reading a photo of a restaurant or store receipt. Extract its contents as JSON matching the response schema.

Rules:
- "items" lists only purchased line items (food, drinks, goods) — never subtotal, tax, tip, service charge, or total lines.
- "quantity" is a plain integer; if the receipt doesn't show one, use 1.
- Every money value ("unitPrice", "subtotal", "tax", "tip", "total") is a decimal string with no currency symbol and no thousands separator, e.g. "12.99". "unitPrice" is the price of a single unit, not the extended line total (if the receipt only shows a line total, divide by quantity).
- If a field isn't legible or isn't present on the receipt, use an empty string ("") for it — never guess a value.
- If the image doesn't look like a receipt or no items are legible, return an empty "items" array.`;

type ScanRequestBody = {
  imageBase64?: string;
  mimeType?: string;
};

class GeminiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGemini(
  model: string,
  apiKey: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: PROMPT }, { inlineData: { mimeType, data: imageBase64 } }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new GeminiRequestError(response.status, errText || `HTTP ${response.status}`);
  }

  const payload = await response.json();
  const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiRequestError(502, "Gemini returned an empty response");
  return text;
}

/**
 * Tries each model in GEMINI_MODELS in order, retrying a model with backoff
 * on 429/500/503 (rate limit / transient / "high demand") before moving on
 * to the next one. A non-retryable error (bad request, auth, etc.) aborts
 * immediately — switching models won't fix those.
 */
async function requestGeminiWithFallback(
  apiKey: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await requestGemini(model, apiKey, imageBase64, mimeType);
      } catch (err) {
        lastError = err;
        const status = err instanceof GeminiRequestError ? err.status : undefined;
        const retryable = status === undefined || RETRYABLE_STATUS.has(status);
        console.error(
          `scan-receipt: ${model} attempt ${attempt + 1}/${MAX_ATTEMPTS_PER_MODEL} failed`,
          status,
          err instanceof Error ? err.message : err
        );

        if (!retryable) throw err;
        if (attempt === MAX_ATTEMPTS_PER_MODEL - 1) break; // out of retries — fall through to next model

        const delay = Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 500;
        await sleep(delay);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini unavailable after retries and fallback");
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Receipt scanning isn't configured on this server yet.",
      },
      { status: 500 }
    );
  }

  let body: ScanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { ok: false, error: "Missing image data." },
      { status: 400 }
    );
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported image type." },
      { status: 400 }
    );
  }
  const approxBytes = (imageBase64.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "That image is too large." },
      { status: 400 }
    );
  }

  let text: string;
  try {
    text = await requestGeminiWithFallback(apiKey, imageBase64, mimeType);
  } catch (err) {
    const status = err instanceof GeminiRequestError ? err.status : 502;
    console.error(
      "scan-receipt: Gemini unavailable after retries/fallback",
      status,
      err instanceof Error ? err.message : err
    );
    const responseStatus = status === 429 || status === 503 ? status : 502;
    return NextResponse.json(
      {
        ok: false,
        error:
          status === 429
            ? "Receipt scanning is rate-limited right now — try again in a bit."
            : status === 503
              ? "The receipt scanning service is busy right now — try again in a moment."
              : "The receipt scanning service returned an error.",
      },
      { status: responseStatus }
    );
  }

  let raw: RawScannedReceipt;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    console.error("scan-receipt: failed to parse Gemini JSON", err, text);
    return NextResponse.json(
      { ok: false, error: "Couldn't understand the receipt scan result." },
      { status: 502 }
    );
  }

  const scanned = normalizeScannedReceipt(raw);
  if (scanned.items.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Couldn't find any items on that receipt — try a clearer photo.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, data: scanned });
}
