import { describe, expect, it } from "vitest";
import type {
  BillAdjustments,
  ItemAssignment,
  Person,
  ReceiptItem,
} from "@/types/bill";
import { calculateItemizedSplit } from "./itemized-split";
import { getCalculatedTotalCents } from "./validation";

const people: Person[] = [
  { id: "p1", name: "Andrew" },
  { id: "p2", name: "Jason" },
  { id: "p3", name: "Satria" },
];

const noAdjustments: BillAdjustments = {
  taxCents: 0,
  tipCents: 0,
  feeCents: 0,
  discountCents: 0,
};

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0);
}

describe("calculateItemizedSplit", () => {
  it("assigns an individually-owned item entirely to that person", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Burger", quantity: 1, unitPriceCents: 1200 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);

    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(1200);
    expect(breakdowns.find((b) => b.personId === "p2")?.itemSubtotalCents).toBe(0);
    expect(breakdowns.find((b) => b.personId === "p3")?.itemSubtotalCents).toBe(0);
  });

  it("splits an item shared by two people evenly", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Nachos", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1", "p2"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);

    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(500);
    expect(breakdowns.find((b) => b.personId === "p2")?.itemSubtotalCents).toBe(500);
  });

  it("splits an item shared by three people, remainder cent to displayed order", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Pizza", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p3", "p1", "p2"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);

    // 1000 / 3 = 333.33 -> remainder cent goes to p1 (first in `people` order),
    // regardless of the order personIds were listed in the assignment.
    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(334);
    expect(breakdowns.find((b) => b.personId === "p2")?.itemSubtotalCents).toBe(333);
    expect(breakdowns.find((b) => b.personId === "p3")?.itemSubtotalCents).toBe(333);
  });

  it("combines multiple shared and individual items per person", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "Burger", quantity: 1, unitPriceCents: 1200 }, // p1 alone
      { id: "i2", name: "Nachos", quantity: 1, unitPriceCents: 1000 }, // p1 + p2
      { id: "i3", name: "Soda", quantity: 1, unitPriceCents: 300 }, // p2 alone
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p1", "p2"] },
      { itemId: "i3", personIds: ["p2"] },
    ];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);

    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(1700); // 1200 + 500
    expect(breakdowns.find((b) => b.personId === "p2")?.itemSubtotalCents).toBe(800); // 500 + 300
    expect(breakdowns.find((b) => b.personId === "p3")?.itemSubtotalCents).toBe(0);
  });

  it("allocates tax proportionally to item subtotal", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 3000 }, // p1
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 1000 }, // p2
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p2"] },
    ];
    const adjustments: BillAdjustments = { ...noAdjustments, taxCents: 400 };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);

    // p1: 3000/4000 * 400 = 300, p2: 1000/4000 * 400 = 100
    expect(breakdowns.find((b) => b.personId === "p1")?.taxCents).toBe(300);
    expect(breakdowns.find((b) => b.personId === "p2")?.taxCents).toBe(100);
    expect(breakdowns.find((b) => b.personId === "p3")?.taxCents).toBe(0);
  });

  it("allocates tip proportionally to item subtotal", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 2000 }, // p1
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 2000 }, // p2
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p2"] },
    ];
    const adjustments: BillAdjustments = { ...noAdjustments, tipCents: 800 };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);

    expect(breakdowns.find((b) => b.personId === "p1")?.tipCents).toBe(400);
    expect(breakdowns.find((b) => b.personId === "p2")?.tipCents).toBe(400);
  });

  it("allocates fees and discounts proportionally to item subtotal", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 3000 }, // p1
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 1000 }, // p2
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p2"] },
    ];
    const adjustments: BillAdjustments = { ...noAdjustments, feeCents: 200, discountCents: 400 };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);

    const p1 = breakdowns.find((b) => b.personId === "p1")!;
    const p2 = breakdowns.find((b) => b.personId === "p2")!;
    expect(p1.feeCents).toBe(150);
    expect(p2.feeCents).toBe(50);
    expect(p1.discountCents).toBe(300);
    expect(p2.discountCents).toBe(100);
    expect(p1.totalCents).toBe(3000 + 150 - 300);
    expect(p2.totalCents).toBe(1000 + 50 - 100);
  });

  it("handles zero tax and tip cleanly", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    const p1 = breakdowns.find((b) => b.personId === "p1")!;
    expect(p1.taxCents).toBe(0);
    expect(p1.tipCents).toBe(0);
    expect(p1.totalCents).toBe(1000);
  });

  it("multiplies unit price by quantity greater than one", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Beer", quantity: 3, unitPriceCents: 600 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(1800);
  });

  it("rounds a fractional line total to the nearest cent", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Wings", quantity: 0.5, unitPriceCents: 999 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    // 0.5 * 999 = 499.5 -> rounds to 500
    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(500);
  });

  it("splits a very small adjustment among several people", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 },
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 1000 },
      { id: "i3", name: "C", quantity: 1, unitPriceCents: 1000 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p2"] },
      { itemId: "i3", personIds: ["p3"] },
    ];
    const adjustments: BillAdjustments = { ...noAdjustments, feeCents: 1 };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);
    const feeCentsTotal = sumBy(breakdowns, (b) => b.feeCents);
    expect(feeCentsTotal).toBe(1);
    // Equal weights -> the single cent goes to the first person in displayed order.
    expect(breakdowns.find((b) => b.personId === "p1")?.feeCents).toBe(1);
  });

  it("gives one person the full total when they're assigned every item", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 },
      { id: "i2", name: "B", quantity: 2, unitPriceCents: 500 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: ["p1"] },
    ];
    const adjustments: BillAdjustments = { taxCents: 160, tipCents: 300, feeCents: 50, discountCents: 20 };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);
    const p1 = breakdowns.find((b) => b.personId === "p1")!;
    const others = breakdowns.filter((b) => b.personId !== "p1");

    expect(p1.itemSubtotalCents).toBe(2000);
    expect(p1.taxCents).toBe(160);
    expect(p1.tipCents).toBe(300);
    expect(p1.feeCents).toBe(50);
    expect(p1.discountCents).toBe(20);
    for (const other of others) {
      expect(other.totalCents).toBe(0);
    }
  });

  it("always sums final totals to the calculated receipt total", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 2, unitPriceCents: 733 },
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 1999 },
      { id: "i3", name: "C", quantity: 3, unitPriceCents: 250 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1", "p2", "p3"] },
      { itemId: "i2", personIds: ["p2"] },
      { itemId: "i3", personIds: ["p1", "p3"] },
    ];
    const adjustments: BillAdjustments = {
      taxCents: 337,
      tipCents: 611,
      feeCents: 99,
      discountCents: 150,
    };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);
    const calculatedTotal = getCalculatedTotalCents(items, adjustments);
    const sumOfTotals = sumBy(breakdowns, (b) => b.totalCents);

    expect(sumOfTotals).toBe(calculatedTotal);
  });

  it("makes every adjustment category sum exactly to its original input", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 733 },
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 1999 },
      { id: "i3", name: "C", quantity: 1, unitPriceCents: 250 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1", "p2"] },
      { itemId: "i2", personIds: ["p2", "p3"] },
      { itemId: "i3", personIds: ["p1"] },
    ];
    const adjustments: BillAdjustments = {
      taxCents: 337,
      tipCents: 611,
      feeCents: 99,
      discountCents: 150,
    };

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, adjustments);

    expect(sumBy(breakdowns, (b) => b.taxCents)).toBe(adjustments.taxCents);
    expect(sumBy(breakdowns, (b) => b.tipCents)).toBe(adjustments.tipCents);
    expect(sumBy(breakdowns, (b) => b.feeCents)).toBe(adjustments.feeCents);
    expect(sumBy(breakdowns, (b) => b.discountCents)).toBe(adjustments.discountCents);
  });

  it("treats an item with an empty assignment as unassigned (contributes nothing)", () => {
    const items: ReceiptItem[] = [
      { id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 },
      { id: "i2", name: "B", quantity: 1, unitPriceCents: 500 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "i1", personIds: ["p1"] },
      { itemId: "i2", personIds: [] },
    ];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    const total = sumBy(breakdowns, (b) => b.itemSubtotalCents);
    expect(total).toBe(1000);
  });

  it("treats an item missing from the assignments array as unassigned", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    const { breakdowns } = calculateItemizedSplit(items, [], people, noAdjustments);
    expect(sumBy(breakdowns, (b) => b.itemSubtotalCents)).toBe(0);
  });

  it("returns an empty split for an empty people list", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1"] }];
    const result = calculateItemizedSplit(items, assignments, [], noAdjustments);
    expect(result.breakdowns).toEqual([]);
  });

  it("returns zeroed breakdowns for an empty item list", () => {
    const result = calculateItemizedSplit([], [], people, noAdjustments);
    expect(result.breakdowns).toHaveLength(3);
    for (const b of result.breakdowns) {
      expect(b.totalCents).toBe(0);
    }
  });

  it("ignores assigned person ids that no longer exist in the people list", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1", "ghost"] }];

    const { breakdowns } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    // Only p1 remains a valid assignee, so they get the full item.
    expect(breakdowns.find((b) => b.personId === "p1")?.itemSubtotalCents).toBe(1000);
  });

  it("populates itemDetails per person for assigned items", () => {
    const items: ReceiptItem[] = [{ id: "i1", name: "Nachos", quantity: 1, unitPriceCents: 1000 }];
    const assignments: ItemAssignment[] = [{ itemId: "i1", personIds: ["p1", "p2"] }];

    const { itemDetails } = calculateItemizedSplit(items, assignments, people, noAdjustments);
    expect(itemDetails.p1).toEqual([
      { itemId: "i1", itemName: "Nachos", quantity: 1, lineTotalCents: 1000, sharedWith: 2, shareCents: 500 },
    ]);
    expect(itemDetails.p3).toEqual([]);
  });
});
