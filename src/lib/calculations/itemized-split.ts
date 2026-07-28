import type {
  BillAdjustments,
  ItemAssignment,
  Person,
  PersonBreakdown,
  PersonItemDetail,
  ReceiptItem,
  SplitResult,
} from "@/types/bill";
import { allocateEvenly, allocateProportionally } from "./allocate-cents";
import { getItemLineTotalCents } from "./validation";

/**
 * Build a per-person itemized split.
 *
 * 1. Each item's line total is divided equally among the people it's
 *    assigned to (allocateEvenly), in the order those people appear in
 *    `people` — this keeps remainder-cent placement deterministic
 *    regardless of selection order.
 * 2. Each person's assigned-item shares are summed into an item subtotal.
 * 3. Tax, tip, fee, and discount are each divided across people
 *    proportionally to their item subtotal (allocateProportionally, a
 *    largest-remainder allocation) so every category's shares sum exactly
 *    back to the original input.
 * 4. A person's final total is itemSubtotal + tax + tip + fee - discount.
 *
 * Items with no one assigned (empty or missing ItemAssignment) contribute
 * nothing to anyone. Callers should block finishing the split while
 * findUnassignedItemIds(...) is non-empty.
 */
export function calculateItemizedSplit(
  items: ReceiptItem[],
  assignments: ItemAssignment[],
  people: Person[],
  adjustments: BillAdjustments
): SplitResult {
  if (people.length === 0) {
    return { breakdowns: [], itemDetails: {} };
  }

  const personOrder = new Map(people.map((person, index) => [person.id, index]));
  const assignmentByItemId = new Map(assignments.map((a) => [a.itemId, a]));

  const itemSubtotalByPersonId = new Map<string, number>(people.map((p) => [p.id, 0]));
  const itemDetails: Record<string, PersonItemDetail[]> = Object.fromEntries(
    people.map((p) => [p.id, []])
  );

  for (const item of items) {
    const assignment = assignmentByItemId.get(item.id);
    const assignedPersonIds = (assignment?.personIds ?? []).filter((id) =>
      personOrder.has(id)
    );
    if (assignedPersonIds.length === 0) continue;

    const orderedPersonIds = [...assignedPersonIds].sort(
      (a, b) => personOrder.get(a)! - personOrder.get(b)!
    );

    const lineTotalCents = getItemLineTotalCents(item);
    const shares = allocateEvenly(lineTotalCents, orderedPersonIds.length);

    orderedPersonIds.forEach((personId, i) => {
      const shareCents = shares[i]!;
      itemSubtotalByPersonId.set(
        personId,
        (itemSubtotalByPersonId.get(personId) ?? 0) + shareCents
      );
      itemDetails[personId]!.push({
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        lineTotalCents,
        sharedWith: orderedPersonIds.length,
        shareCents,
      });
    });
  }

  const itemSubtotals = people.map((p) => itemSubtotalByPersonId.get(p.id) ?? 0);

  const taxShares = allocateProportionally(adjustments.taxCents, itemSubtotals);
  const tipShares = allocateProportionally(adjustments.tipCents, itemSubtotals);
  const feeShares = allocateProportionally(adjustments.feeCents, itemSubtotals);
  const discountShares = allocateProportionally(adjustments.discountCents, itemSubtotals);

  const breakdowns: PersonBreakdown[] = people.map((person, i) => {
    const itemSubtotalCents = itemSubtotals[i]!;
    const taxCents = taxShares[i]!;
    const tipCents = tipShares[i]!;
    const feeCents = feeShares[i]!;
    const discountCents = discountShares[i]!;
    return {
      personId: person.id,
      itemSubtotalCents,
      taxCents,
      tipCents,
      feeCents,
      discountCents,
      totalCents: itemSubtotalCents + taxCents + tipCents + feeCents - discountCents,
    };
  });

  return { breakdowns, itemDetails };
}
