import type {
  BillAdjustments,
  ItemAssignment,
  Person,
  ReceiptItem,
} from "@/types/bill";

/** A single receipt item's line total, rounded to the nearest cent. */
export function getItemLineTotalCents(item: ReceiptItem): number {
  return Math.round(item.quantity * item.unitPriceCents);
}

/** Sum of every item's line total. */
export function getItemsSubtotalCents(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + getItemLineTotalCents(item), 0);
}

/** items subtotal + tax + tip + fee - discount, derived purely from structured inputs. */
export function getCalculatedTotalCents(
  items: ReceiptItem[],
  adjustments: BillAdjustments
): number {
  return (
    getItemsSubtotalCents(items) +
    adjustments.taxCents +
    adjustments.tipCents +
    adjustments.feeCents -
    adjustments.discountCents
  );
}

/**
 * Compares the calculated total (items + adjustments) against the total the
 * user typed in from the receipt. Receipts often contain small unexplained
 * adjustments, so this is a warning, not a hard error.
 */
export function getTotalMismatch(
  items: ReceiptItem[],
  adjustments: BillAdjustments,
  enteredTotalCents: number | null
): { mismatched: boolean; calculatedTotalCents: number; differenceCents: number } {
  const calculatedTotalCents = getCalculatedTotalCents(items, adjustments);
  if (enteredTotalCents === null) {
    return { mismatched: false, calculatedTotalCents, differenceCents: 0 };
  }
  const differenceCents = enteredTotalCents - calculatedTotalCents;
  return { mismatched: differenceCents !== 0, calculatedTotalCents, differenceCents };
}

export function isBlankName(name: string): boolean {
  return name.trim().length === 0;
}

/** Returns the ids of people whose trimmed, case-insensitive name collides with another person's. */
export function findDuplicateNamePersonIds(people: Person[]): Set<string> {
  const countByName = new Map<string, number>();
  for (const person of people) {
    const key = person.name.trim().toLowerCase();
    if (key === "") continue;
    countByName.set(key, (countByName.get(key) ?? 0) + 1);
  }

  const duplicateIds = new Set<string>();
  for (const person of people) {
    const key = person.name.trim().toLowerCase();
    if (key !== "" && (countByName.get(key) ?? 0) > 1) {
      duplicateIds.add(person.id);
    }
  }
  return duplicateIds;
}

/** Item ids that have no one (or an empty assignment) attached to them. */
export function findUnassignedItemIds(
  items: ReceiptItem[],
  assignments: ItemAssignment[]
): string[] {
  const assignmentByItemId = new Map(assignments.map((a) => [a.itemId, a]));
  return items
    .filter((item) => {
      const assignment = assignmentByItemId.get(item.id);
      return !assignment || assignment.personIds.length === 0;
    })
    .map((item) => item.id);
}

export function validateReceiptItem(item: Pick<ReceiptItem, "name" | "quantity" | "unitPriceCents">): string[] {
  const errors: string[] = [];
  if (isBlankName(item.name)) errors.push("Item name is required");
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }
  if (!Number.isFinite(item.unitPriceCents) || item.unitPriceCents < 0) {
    errors.push("Price can't be negative");
  }
  return errors;
}
