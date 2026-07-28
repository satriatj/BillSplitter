import type { Person, PersonBreakdown, SplitResult } from "@/types/bill";
import { allocateEvenly } from "./allocate-cents";

/**
 * Divide `totalCents` evenly among the entries of `people` that are not in
 * `excludedPersonIds`. Any remainder cents (from `totalCents` not being
 * evenly divisible by the included headcount) are handed out one at a time
 * to included people in the order they appear in `people` — see
 * allocateEvenly in allocate-cents.ts.
 *
 * Equal split has no item-level or adjustment-level breakdown, so the full
 * per-person share is reported as itemSubtotalCents with the adjustment
 * fields at zero; totalCents always equals itemSubtotalCents.
 */
export function calculateEqualSplit(
  totalCents: number,
  people: Person[],
  excludedPersonIds: string[] = []
): SplitResult {
  const excluded = new Set(excludedPersonIds);
  const included = people.filter((person) => !excluded.has(person.id));

  if (included.length === 0) {
    return { breakdowns: [], itemDetails: {} };
  }

  const shares = allocateEvenly(totalCents, included.length);

  const breakdowns: PersonBreakdown[] = included.map((person, i) => ({
    personId: person.id,
    itemSubtotalCents: shares[i]!,
    taxCents: 0,
    tipCents: 0,
    feeCents: 0,
    discountCents: 0,
    totalCents: shares[i]!,
  }));

  return { breakdowns, itemDetails: {} };
}
