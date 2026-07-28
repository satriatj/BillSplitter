/**
 * Deterministic integer-cent allocation.
 *
 * We always need to split a whole number of cents into N parts that sum
 * back exactly to the original total. Simple division leaves leftover
 * cents (e.g. $10.00 / 3 = 333.33...). This module resolves that with the
 * "largest remainder" method:
 *
 *   1. Give everyone the floor of their exact (fractional) share.
 *   2. Compute how many cents are left over (always a small non-negative
 *      integer, at most `weights.length - 1`).
 *   3. Hand out one leftover cent at a time to the entries with the
 *      largest fractional remainder, breaking ties by the entry's
 *      position in the input array (earlier wins).
 *
 * This guarantees: every share is within 1 cent of its exact
 * proportional value, and the shares always sum exactly to `total`.
 */

/**
 * Split `totalCents` across `weights.length` entries, proportional to each
 * weight, using the largest-remainder method. Weights of 0 always receive 0.
 * Returns an array of cent amounts, same length and order as `weights`.
 */
export function allocateProportionally(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  if (weightSum <= 0) {
    // Nothing to weight by: fall back to an even split among all entries.
    return allocateEvenly(totalCents, weights.length);
  }

  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const floors = exact.map((value) => Math.floor(value));
  const remainders = exact.map((value, i) => value - floors[i]!);

  const allocated = floors.reduce((sum, v) => sum + v, 0);
  let leftover = totalCents - allocated;

  const order = remainders
    .map((remainder, index) => ({ remainder, index }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  const result = [...floors];
  for (let i = 0; i < order.length && leftover > 0; i++, leftover--) {
    result[order[i]!.index]! += 1;
  }

  return result;
}

/**
 * Split `totalCents` evenly across `count` entries. Any leftover cents
 * (from the remainder of totalCents / count) go to entries in order,
 * one cent each, starting from index 0 — deterministic and stable.
 */
export function allocateEvenly(totalCents: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  const leftover = totalCents - base * count;
  const result = new Array<number>(count).fill(base);
  for (let i = 0; i < leftover; i++) {
    result[i]! += 1;
  }
  return result;
}
