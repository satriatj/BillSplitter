import { describe, expect, it } from "vitest";
import {
  centsToDecimalString,
  formatCents,
  parseCurrencyToCents,
  parseOptionalCurrencyToCents,
} from "./currency";

describe("parseCurrencyToCents", () => {
  const cases: Array<{
    input: string;
    expectedCents?: number;
    ok: boolean;
    options?: Parameters<typeof parseCurrencyToCents>[1];
  }> = [
    { input: "12", expectedCents: 1200, ok: true },
    { input: "12.5", expectedCents: 1250, ok: true },
    { input: "12.50", expectedCents: 1250, ok: true },
    { input: "0", expectedCents: 0, ok: true },
    { input: "0.01", expectedCents: 1, ok: true },
    { input: "0.99", expectedCents: 99, ok: true },
    { input: "  12.50  ", expectedCents: 1250, ok: true },
    { input: "$12.50", expectedCents: 1250, ok: true },
    { input: "1,234.50", expectedCents: 123450, ok: true },
    { input: ".5", expectedCents: 50, ok: true },
    { input: "100.00", expectedCents: 10000, ok: true },
    { input: "", ok: false },
    { input: "   ", ok: false },
    { input: "-", ok: false },
    { input: "abc", ok: false },
    { input: "12.5.5", ok: false },
    { input: "12,5", ok: false },
    { input: "$$12", ok: false },
    { input: "12.999", ok: false },
    { input: "12.123", ok: false },
    { input: "-12.50", ok: false }, // negative rejected by default
    { input: "-12.50", expectedCents: -1250, ok: true, options: { allowNegative: true } },
    { input: "12.999", expectedCents: 1300, ok: true, options: { roundExcessDecimals: true } },
    { input: "12.994", expectedCents: 1299, ok: true, options: { roundExcessDecimals: true } },
    { input: "12.995", expectedCents: 1300, ok: true, options: { roundExcessDecimals: true } },
    { input: "0.005", expectedCents: 1, ok: true, options: { roundExcessDecimals: true } },
    { input: "9.999", expectedCents: 1000, ok: true, options: { roundExcessDecimals: true } },
  ];

  it.each(cases)(
    "parses %j predictably",
    ({ input, expectedCents, ok, options }) => {
      const result = parseCurrencyToCents(input, options);
      expect(result.ok).toBe(ok);
      if (ok && result.ok) {
        expect(result.cents).toBe(expectedCents);
      }
    }
  );

  it("rejects excessive decimal precision by default", () => {
    const result = parseCurrencyToCents("12.345");
    expect(result.ok).toBe(false);
  });

  it("rejects amounts too large to be safe integers", () => {
    const result = parseCurrencyToCents("9".repeat(20));
    expect(result.ok).toBe(false);
  });
});

describe("parseOptionalCurrencyToCents", () => {
  it("returns null cents for a blank string", () => {
    const result = parseOptionalCurrencyToCents("");
    expect(result).toEqual({ ok: true, cents: null });
  });

  it("returns null cents for a whitespace-only string", () => {
    const result = parseOptionalCurrencyToCents("   ");
    expect(result).toEqual({ ok: true, cents: null });
  });

  it("parses a real value normally", () => {
    const result = parseOptionalCurrencyToCents("5.25");
    expect(result).toEqual({ ok: true, cents: 525 });
  });

  it("still rejects malformed values", () => {
    const result = parseOptionalCurrencyToCents("abc");
    expect(result.ok).toBe(false);
  });
});

describe("formatCents", () => {
  it.each([
    [0, "$0.00"],
    [1, "$0.01"],
    [99, "$0.99"],
    [100, "$1.00"],
    [1250, "$12.50"],
    [123450, "$1,234.50"],
    [-1250, "-$12.50"],
    [5, "$0.05"],
  ])("formats %i as %s", (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });
});

describe("centsToDecimalString", () => {
  it.each([
    [0, "0.00"],
    [1250, "12.50"],
    [5, "0.05"],
    [-1250, "-12.50"],
  ])("formats %i as %s", (cents, expected) => {
    expect(centsToDecimalString(cents)).toBe(expected);
  });
});
