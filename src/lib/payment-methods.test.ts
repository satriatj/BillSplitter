import { describe, expect, it } from "vitest";
import { formatPaymentMethod, formatPaymentMethodsList } from "./payment-methods";
import type { PaymentMethod } from "@/types/bill";

describe("formatPaymentMethod", () => {
  it.each([
    [{ type: "venmo", value: "@satria" }, "Venmo @satria"],
    [{ type: "zelle", value: "555-1234" }, "Zelle 555-1234"],
    [{ type: "paypal", value: "satria@example.com" }, "PayPal satria@example.com"],
    [{ type: "cashapp", value: "$satria" }, "Cash App $satria"],
    [{ type: "other", value: "bank transfer" }, "Other bank transfer"],
  ] as const)("formats %j as %s", (method, expected) => {
    expect(formatPaymentMethod(method)).toBe(expected);
  });

  it("falls back to just the label when the value is blank", () => {
    expect(formatPaymentMethod({ type: "venmo", value: "   " })).toBe("Venmo");
  });
});

describe("formatPaymentMethodsList", () => {
  const method = (type: PaymentMethod["type"], value: string): PaymentMethod => ({
    id: "id",
    type,
    value,
  });

  it("returns an empty string for no methods", () => {
    expect(formatPaymentMethodsList([])).toBe("");
  });

  it("returns a single method as-is", () => {
    expect(formatPaymentMethodsList([method("venmo", "@satria")])).toBe("Venmo @satria");
  });

  it("joins two methods with 'or'", () => {
    expect(formatPaymentMethodsList([method("venmo", "@satria"), method("zelle", "555-1234")])).toBe(
      "Venmo @satria or Zelle 555-1234"
    );
  });

  it("joins three or more methods with an Oxford comma before 'or'", () => {
    const methods = [method("venmo", "@satria"), method("zelle", "555-1234"), method("paypal", "@s")];
    expect(formatPaymentMethodsList(methods)).toBe("Venmo @satria, Zelle 555-1234, or PayPal @s");
  });
});
