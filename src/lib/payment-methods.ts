import type { PaymentMethod, PaymentMethodType } from "@/types/bill";

export const PAYMENT_METHOD_TYPES: PaymentMethodType[] = [
  "venmo",
  "zelle",
  "paypal",
  "cashapp",
  "other",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  venmo: "Venmo",
  zelle: "Zelle",
  paypal: "PayPal",
  cashapp: "Cash App",
  other: "Other",
};

/** "Venmo @satria" — falls back to just the label if the value is blank. */
export function formatPaymentMethod(method: Pick<PaymentMethod, "type" | "value">): string {
  const label = PAYMENT_METHOD_LABELS[method.type];
  const value = method.value.trim();
  return value ? `${label} ${value}` : label;
}

/** Joins formatted methods into a readable list: "A", "A or B", "A, B, or C". */
export function formatPaymentMethodsList(methods: PaymentMethod[]): string {
  const formatted = methods.map(formatPaymentMethod);
  if (formatted.length === 0) return "";
  if (formatted.length === 1) return formatted[0]!;
  if (formatted.length === 2) return `${formatted[0]} or ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, or ${formatted[formatted.length - 1]}`;
}
