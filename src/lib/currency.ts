/**
 * Currency parsing and formatting.
 *
 * All money is represented as integer cents. Parsing never uses
 * floating-point math — the string is split into whole/fractional parts
 * and combined with BigInt so no precision is ever lost.
 */

export type ParsedCurrency =
  | { ok: true; cents: number }
  | { ok: false; error: string };

export type ParseCurrencyOptions = {
  /** Allow a leading "-" sign. Defaults to false (most money fields are non-negative entries). */
  allowNegative?: boolean;
  /**
   * When the input has more than 2 decimal places, round to the nearest cent
   * (half-up) instead of rejecting. Defaults to false, which rejects.
   */
  roundExcessDecimals?: boolean;
};

const GROUPED_THOUSANDS_PATTERN = /^\d{1,3}(,\d{3})+(\.\d+)?$/;
const PLAIN_NUMBER_PATTERN = /^(\d+(\.\d+)?|\.\d+)$/;

/**
 * Parse a user-entered amount ("12", "12.5", "12.50", "$1,234.50") into
 * integer cents. Rejects more than two decimal places unless
 * `roundExcessDecimals` is set, in which case the third decimal digit
 * decides a half-up round into the cent place.
 */
export function parseCurrencyToCents(
  raw: string,
  options: ParseCurrencyOptions = {}
): ParsedCurrency {
  const { allowNegative = false, roundExcessDecimals = false } = options;

  let working = raw.trim();
  if (working === "") {
    return { ok: false, error: "Enter an amount" };
  }

  const negative = working.startsWith("-");
  if (negative) {
    working = working.slice(1).trim();
  }
  if (working.startsWith("$")) {
    working = working.slice(1);
  }
  working = working.replace(/\s/g, "");

  if (working === "") {
    return { ok: false, error: "Enter an amount" };
  }
  if (negative && !allowNegative) {
    return { ok: false, error: "Amount can't be negative" };
  }

  if (working.includes(",")) {
    if (!GROUPED_THOUSANDS_PATTERN.test(working)) {
      return { ok: false, error: "Enter a valid amount" };
    }
    working = working.replace(/,/g, "");
  }

  if (!PLAIN_NUMBER_PATTERN.test(working)) {
    return { ok: false, error: "Enter a valid amount" };
  }

  const [wholeRaw, fracRaw = ""] = working.split(".");
  const whole = wholeRaw === "" ? "0" : wholeRaw;

  let fracDigits = fracRaw;
  let carry = 0n;

  if (fracDigits.length > 2) {
    if (!roundExcessDecimals) {
      return { ok: false, error: "Use at most 2 decimal places" };
    }
    const roundDigit = fracDigits.charAt(2);
    carry = roundDigit >= "5" ? 1n : 0n;
    fracDigits = fracDigits.slice(0, 2);
  }
  fracDigits = fracDigits.padEnd(2, "0");

  let cents: bigint;
  try {
    cents = BigInt(whole) * 100n + BigInt(fracDigits === "" ? "0" : fracDigits) + carry;
  } catch {
    return { ok: false, error: "Enter a valid amount" };
  }

  if (negative) cents = -cents;

  if (cents > BigInt(Number.MAX_SAFE_INTEGER) || cents < -BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, error: "Amount is too large" };
  }

  return { ok: true, cents: Number(cents) };
}

/** Convenience wrapper returning cents or null (for optional fields left blank). */
export function parseOptionalCurrencyToCents(
  raw: string,
  options?: ParseCurrencyOptions
): ParsedCurrency | { ok: true; cents: null } {
  if (raw.trim() === "") return { ok: true, cents: null };
  return parseCurrencyToCents(raw, options);
}

/** Format cents as "$12.50" without ever going through floating-point division. */
export function formatCents(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  const sign = safeCents < 0 ? "-" : "";
  const abs = Math.abs(safeCents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder.toString().padStart(2, "0")}`;
}

/** Format cents as a bare decimal string ("12.50") for use inside input fields. */
export function centsToDecimalString(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  const sign = safeCents < 0 ? "-" : "";
  const abs = Math.abs(safeCents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars}.${remainder.toString().padStart(2, "0")}`;
}
