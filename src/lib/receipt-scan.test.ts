import { describe, expect, it } from "vitest";
import { normalizeScannedReceipt } from "./receipt-scan";

describe("normalizeScannedReceipt", () => {
  it("parses a well-formed scan into cents", () => {
    const result = normalizeScannedReceipt({
      restaurantName: "  Hawi  ",
      items: [
        { name: "Burger", quantity: 2, unitPrice: "12.50" },
        { name: "Fries", quantity: 1, unitPrice: "4.99" },
      ],
      subtotal: "29.99",
      tax: "2.70",
      tip: "6.00",
      total: "38.69",
    });

    expect(result.restaurantName).toBe("Hawi");
    expect(result.items).toEqual([
      expect.objectContaining({ name: "Burger", quantity: 2, unitPriceCents: 1250 }),
      expect.objectContaining({ name: "Fries", quantity: 1, unitPriceCents: 499 }),
    ]);
    expect(result.subtotalCents).toBe(2999);
    expect(result.taxCents).toBe(270);
    expect(result.tipCents).toBe(600);
    expect(result.totalCents).toBe(3869);
    expect(result.hasUncertainAmounts).toBe(false);
  });

  it("drops items with a blank name", () => {
    const result = normalizeScannedReceipt({
      items: [
        { name: "", quantity: 1, unitPrice: "5.00" },
        { name: "  ", quantity: 1, unitPrice: "5.00" },
        { name: "Soda", quantity: 1, unitPrice: "2.00" },
      ],
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Soda");
  });

  it("defaults quantity to 1 when missing, zero, or negative", () => {
    const result = normalizeScannedReceipt({
      items: [
        { name: "A", unitPrice: "1.00" },
        { name: "B", quantity: 0, unitPrice: "1.00" },
        { name: "C", quantity: -3, unitPrice: "1.00" },
      ],
    });
    expect(result.items.map((i) => i.quantity)).toEqual([1, 1, 1]);
  });

  it("flags uncertain amounts when a price can't be parsed, and defaults it to 0", () => {
    const result = normalizeScannedReceipt({
      items: [{ name: "Mystery item", quantity: 1, unitPrice: "market price" }],
    });
    expect(result.items[0]?.unitPriceCents).toBe(0);
    expect(result.hasUncertainAmounts).toBe(true);
  });

  it("flags uncertain amounts when total/subtotal are present but unparseable", () => {
    const result = normalizeScannedReceipt({
      items: [{ name: "Soda", quantity: 1, unitPrice: "2.00" }],
      total: "n/a",
    });
    expect(result.totalCents).toBeNull();
    expect(result.hasUncertainAmounts).toBe(true);
  });

  it("treats missing optional fields as null/zero without flagging uncertainty", () => {
    const result = normalizeScannedReceipt({
      items: [{ name: "Soda", quantity: 1, unitPrice: "2.00" }],
    });
    expect(result.restaurantName).toBeNull();
    expect(result.subtotalCents).toBeNull();
    expect(result.totalCents).toBeNull();
    expect(result.taxCents).toBe(0);
    expect(result.tipCents).toBe(0);
    expect(result.hasUncertainAmounts).toBe(false);
  });

  it("returns no items for a receipt with none", () => {
    const result = normalizeScannedReceipt({ items: [] });
    expect(result.items).toEqual([]);
  });
});
