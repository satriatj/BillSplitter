import { describe, expect, it } from "vitest";
import { allocateEvenly, allocateProportionally } from "./allocate-cents";

describe("allocateEvenly", () => {
  it.each([
    { total: 900, count: 3, expected: [300, 300, 300] },
    { total: 1000, count: 3, expected: [334, 333, 333] },
    { total: 1, count: 3, expected: [1, 0, 0] },
    { total: 0, count: 4, expected: [0, 0, 0, 0] },
    { total: 100, count: 1, expected: [100] },
    { total: 500, count: 2, expected: [250, 250] },
  ])("splits $total across $count as $expected", ({ total, count, expected }) => {
    expect(allocateEvenly(total, count)).toEqual(expected);
  });

  it("returns an empty array for zero entries", () => {
    expect(allocateEvenly(500, 0)).toEqual([]);
  });

  it("always sums back to the original total", () => {
    for (let total = 0; total < 50; total++) {
      for (let count = 1; count <= 7; count++) {
        const shares = allocateEvenly(total, count);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });
});

describe("allocateProportionally", () => {
  it("splits proportionally with no remainder", () => {
    expect(allocateProportionally(1000, [50, 50])).toEqual([500, 500]);
  });

  it("splits proportionally with a remainder, favoring larger remainders first", () => {
    // 100 split 1:1:1 -> 33.33 each, remainder 1 cent goes to first tie
    expect(allocateProportionally(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("gives zero-weight entries nothing when other weights exist", () => {
    expect(allocateProportionally(1000, [100, 0, 0])).toEqual([1000, 0, 0]);
  });

  it("falls back to an even split when every weight is zero", () => {
    expect(allocateProportionally(90, [0, 0, 0])).toEqual([30, 30, 30]);
  });

  it("handles a very small total split among several weighted entries", () => {
    // 1 cent among 3 equal weights: goes to the earliest index on a tie.
    expect(allocateProportionally(1, [100, 100, 100])).toEqual([1, 0, 0]);
  });

  it("returns an empty array for zero entries", () => {
    expect(allocateProportionally(500, [])).toEqual([]);
  });

  it("returns all zeros when the total is zero", () => {
    expect(allocateProportionally(0, [10, 20, 30])).toEqual([0, 0, 0]);
  });

  it("always sums back to the original total across random-ish weights", () => {
    const weightSets = [
      [1, 2, 3],
      [7, 11, 13, 17],
      [100, 1, 1, 1, 1],
      [0, 0, 5],
      [33, 33, 33, 1],
    ];
    for (const weights of weightSets) {
      for (const total of [0, 1, 7, 99, 1000, 123456]) {
        const shares = allocateProportionally(total, weights);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it("keeps every share proportional within a whole cent of its exact value", () => {
    const weights = [30, 30, 40];
    const total = 101;
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const shares = allocateProportionally(total, weights);
    shares.forEach((share, i) => {
      const exact = (total * weights[i]!) / weightSum;
      expect(Math.abs(share - exact)).toBeLessThan(1);
    });
  });
});
