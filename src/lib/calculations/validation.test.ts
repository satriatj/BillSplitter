import { describe, expect, it } from "vitest";
import type { BillAdjustments, ItemAssignment, Person, ReceiptItem } from "@/types/bill";
import {
  findDuplicateNamePersonIds,
  findUnassignedItemIds,
  getCalculatedTotalCents,
  getItemLineTotalCents,
  getItemsSubtotalCents,
  getTotalMismatch,
  isBlankName,
  validateReceiptItem,
} from "./validation";

const noAdjustments: BillAdjustments = { taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0 };

describe("getItemLineTotalCents", () => {
  it.each([
    { quantity: 1, unitPriceCents: 1000, expected: 1000 },
    { quantity: 2, unitPriceCents: 500, expected: 1000 },
    { quantity: 3, unitPriceCents: 333, expected: 999 },
    { quantity: 1.5, unitPriceCents: 200, expected: 300 },
    { quantity: 0.5, unitPriceCents: 999, expected: 500 }, // 499.5 rounds to 500
  ])(
    "quantity=$quantity * unitPriceCents=$unitPriceCents => $expected",
    ({ quantity, unitPriceCents, expected }) => {
      expect(
        getItemLineTotalCents({ id: "i1", name: "Item", quantity, unitPriceCents })
      ).toBe(expected);
    }
  );
});

describe("getItemsSubtotalCents", () => {
  it("sums line totals across items", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "Burger", quantity: 2, unitPriceCents: 1200 },
      { id: "i2", name: "Fries", quantity: 1, unitPriceCents: 500 },
    ];
    expect(getItemsSubtotalCents(items)).toBe(2900);
  });

  it("returns 0 for an empty item list", () => {
    expect(getItemsSubtotalCents([])).toBe(0);
  });
});

describe("getCalculatedTotalCents", () => {
  it("adds tax/tip/fee and subtracts discount from the items subtotal", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Item", quantity: 1, unitPriceCents: 1000 }];
    const adjustments: BillAdjustments = {
      taxCents: 100,
      tipCents: 200,
      feeCents: 50,
      discountCents: 75,
    };
    expect(getCalculatedTotalCents(items, adjustments)).toBe(1275);
  });

  it("equals the items subtotal when there are no adjustments", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Item", quantity: 1, unitPriceCents: 1000 }];
    expect(getCalculatedTotalCents(items, noAdjustments)).toBe(1000);
  });
});

describe("getTotalMismatch", () => {
  const items: ReceiptItem[] = [{ id: "i1", name: "Item", quantity: 1, unitPriceCents: 1000 }];

  it("reports no mismatch when nothing was entered", () => {
    const result = getTotalMismatch(items, noAdjustments, null);
    expect(result.mismatched).toBe(false);
  });

  it("reports no mismatch when entered total matches calculated total", () => {
    const result = getTotalMismatch(items, noAdjustments, 1000);
    expect(result.mismatched).toBe(false);
    expect(result.differenceCents).toBe(0);
  });

  it("reports a mismatch with the signed difference", () => {
    const result = getTotalMismatch(items, noAdjustments, 1050);
    expect(result.mismatched).toBe(true);
    expect(result.differenceCents).toBe(50);
    expect(result.calculatedTotalCents).toBe(1000);
  });
});

describe("isBlankName", () => {
  it.each([
    ["", true],
    ["   ", true],
    ["Andrew", false],
    ["  Andrew  ", false],
  ])("isBlankName(%j) === %s", (name, expected) => {
    expect(isBlankName(name)).toBe(expected);
  });
});

describe("findDuplicateNamePersonIds", () => {
  it("flags case-insensitive, whitespace-insensitive duplicates", () => {
    const people: Person[] = [
      { id: "p1", name: "Andrew" },
      { id: "p2", name: "andrew " },
      { id: "p3", name: "Jason" },
    ];
    expect(findDuplicateNamePersonIds(people)).toEqual(new Set(["p1", "p2"]));
  });

  it("returns an empty set when there are no duplicates", () => {
    const people: Person[] = [
      { id: "p1", name: "Andrew" },
      { id: "p2", name: "Jason" },
    ];
    expect(findDuplicateNamePersonIds(people).size).toBe(0);
  });

  it("ignores blank names when checking for duplicates", () => {
    const people: Person[] = [
      { id: "p1", name: "" },
      { id: "p2", name: "" },
    ];
    expect(findDuplicateNamePersonIds(people).size).toBe(0);
  });

  it("handles an empty people list", () => {
    expect(findDuplicateNamePersonIds([]).size).toBe(0);
  });
});

describe("findUnassignedItemIds", () => {
  const items: ReceiptItem[] = [
    { id: "i1", name: "Burger", quantity: 1, unitPriceCents: 1000 },
    { id: "i2", name: "Fries", quantity: 1, unitPriceCents: 500 },
    { id: "i3", name: "Soda", quantity: 1, unitPriceCents: 300 },
  ];

  it("flags items with no assignment entry at all", () => {
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];
    expect(findUnassignedItemIds(items, assignments)).toEqual(["i2", "i3"]);
  });

  it("flags items with an explicit empty personIds list", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: [] },
      { itemId: "i3", personIds: ["p1"] },
    ];
    expect(findUnassignedItemIds(items, assignments)).toEqual(["i2"]);
  });

  it("returns nothing when every item is assigned", () => {
    const assignments: ItemAssignment[] = items.map((item) => ({
      itemId: item.id,
      personIds: ["p1"],
    }));
    expect(findUnassignedItemIds(items, assignments)).toEqual([]);
  });

  it("returns an empty array for an empty item list", () => {
    expect(findUnassignedItemIds([], [])).toEqual([]);
  });
});

describe("validateReceiptItem", () => {
  it("accepts a well-formed item", () => {
    expect(validateReceiptItem({ name: "Burger", quantity: 1, unitPriceCents: 1000 })).toEqual([]);
  });

  it("rejects a blank name", () => {
    expect(validateReceiptItem({ name: "  ", quantity: 1, unitPriceCents: 1000 })).toContain(
      "Item name is required"
    );
  });

  it("rejects zero or negative quantity", () => {
    expect(validateReceiptItem({ name: "Item", quantity: 0, unitPriceCents: 1000 })).toContain(
      "Quantity must be greater than 0"
    );
    expect(validateReceiptItem({ name: "Item", quantity: -1, unitPriceCents: 1000 })).toContain(
      "Quantity must be greater than 0"
    );
  });

  it("rejects negative unit price", () => {
    expect(validateReceiptItem({ name: "Item", quantity: 1, unitPriceCents: -100 })).toContain(
      "Price can't be negative"
    );
  });

  it("rejects non-finite values", () => {
    expect(
      validateReceiptItem({ name: "Item", quantity: NaN, unitPriceCents: Infinity })
    ).toEqual(
      expect.arrayContaining(["Quantity must be greater than 0", "Price can't be negative"])
    );
  });
});
