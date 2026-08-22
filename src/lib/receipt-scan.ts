/**
 * Turns the raw JSON a vision model returns for a receipt photo into the
 * app's typed shapes. Every money field on the raw shape is a decimal
 * string exactly as printed on the receipt (e.g. "12.99") rather than a
 * JSON number — that lets us reuse parseCurrencyToCents instead of doing
 * floating-point math on a model's numeric output.
 */
import { parseCurrencyToCents } from "./currency";
import { createId } from "./id";
import type { ReceiptItem } from "@/types/bill";

export type RawScannedItem = {
  name?: string;
  quantity?: number;
  unitPrice?: string;
};

export type RawScannedReceipt = {
  restaurantName?: string;
  items?: RawScannedItem[];
  subtotal?: string;
  tax?: string;
  tip?: string;
  total?: string;
};

export type ScannedReceipt = {
  restaurantName: string | null;
  items: ReceiptItem[];
  subtotalCents: number | null;
  taxCents: number;
  tipCents: number;
  totalCents: number | null;
  /** True if any item's price (or a total field) couldn't be read and was defaulted, so the UI can ask the user to double-check. */
  hasUncertainAmounts: boolean;
};

function parseMoneyOrNull(raw: string | undefined): number | null {
  if (!raw || raw.trim() === "") return null;
  const parsed = parseCurrencyToCents(raw, { roundExcessDecimals: true });
  return parsed.ok ? parsed.cents : null;
}

export function normalizeScannedReceipt(raw: RawScannedReceipt): ScannedReceipt {
  let hasUncertainAmounts = false;

  const items: ReceiptItem[] = (raw.items ?? [])
    .map((rawItem): ReceiptItem | null => {
      const name = (rawItem.name ?? "").trim();
      if (name === "") return null;

      const quantity =
        Number.isFinite(rawItem.quantity) && (rawItem.quantity as number) > 0
          ? Math.round(rawItem.quantity as number)
          : 1;

      const unitPriceCents = parseMoneyOrNull(rawItem.unitPrice);
      if (unitPriceCents === null) hasUncertainAmounts = true;

      return {
        id: createId(),
        name,
        quantity,
        unitPriceCents: unitPriceCents ?? 0,
      };
    })
    .filter((item): item is ReceiptItem => item !== null);

  const subtotalCents = parseMoneyOrNull(raw.subtotal);
  const totalCents = parseMoneyOrNull(raw.total);
  if ((raw.subtotal && subtotalCents === null) || (raw.total && totalCents === null)) {
    hasUncertainAmounts = true;
  }

  return {
    restaurantName: raw.restaurantName?.trim() || null,
    items,
    subtotalCents,
    taxCents: parseMoneyOrNull(raw.tax) ?? 0,
    tipCents: parseMoneyOrNull(raw.tip) ?? 0,
    totalCents,
    hasUncertainAmounts,
  };
}
