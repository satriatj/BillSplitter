import { describe, expect, it } from "vitest";
import type { Person } from "@/types/bill";
import { calculateEqualSplit } from "./equal-split";

const people: Person[] = [
  { id: "p1", name: "Andrew" },
  { id: "p2", name: "Jason" },
  { id: "p3", name: "Satria" },
];

describe("calculateEqualSplit", () => {
  it("divides evenly with no remainder", () => {
    const result = calculateEqualSplit(900, people);
    expect(result.breakdowns.map((b) => b.totalCents)).toEqual([300, 300, 300]);
  });

  it("distributes remainder cents to earlier people in displayed order", () => {
    const result = calculateEqualSplit(1000, people);
    expect(result.breakdowns.map((b) => b.totalCents)).toEqual([334, 333, 333]);
  });

  it("excludes a person from the split", () => {
    const result = calculateEqualSplit(1000, people, ["p2"]);
    expect(result.breakdowns.map((b) => b.personId)).toEqual(["p1", "p3"]);
    expect(result.breakdowns.map((b) => b.totalCents)).toEqual([500, 500]);
  });

  it("sets itemSubtotalCents equal to totalCents since equal split has no breakdown", () => {
    const result = calculateEqualSplit(1000, people);
    for (const b of result.breakdowns) {
      expect(b.itemSubtotalCents).toBe(b.totalCents);
      expect(b.taxCents).toBe(0);
      expect(b.tipCents).toBe(0);
      expect(b.feeCents).toBe(0);
      expect(b.discountCents).toBe(0);
    }
  });

  it("shares always sum exactly to the receipt total", () => {
    for (const total of [0, 1, 7, 100, 999, 123456]) {
      const result = calculateEqualSplit(total, people);
      const sum = result.breakdowns.reduce((s, b) => s + b.totalCents, 0);
      expect(sum).toBe(total);
    }
  });

  it("returns an empty split when everyone is excluded", () => {
    const result = calculateEqualSplit(1000, people, ["p1", "p2", "p3"]);
    expect(result.breakdowns).toEqual([]);
  });

  it("returns an empty split for an empty people list", () => {
    const result = calculateEqualSplit(1000, []);
    expect(result.breakdowns).toEqual([]);
  });

  it("handles a single included person taking the full total", () => {
    const result = calculateEqualSplit(1234, people, ["p2", "p3"]);
    expect(result.breakdowns).toEqual([
      {
        personId: "p1",
        itemSubtotalCents: 1234,
        taxCents: 0,
        tipCents: 0,
        feeCents: 0,
        discountCents: 0,
        totalCents: 1234,
      },
    ]);
  });
});
