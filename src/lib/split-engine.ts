import type { BillDraft, SplitResult } from "@/types/bill";
import { calculateEqualSplit } from "./calculations/equal-split";
import { calculateItemizedSplit } from "./calculations/itemized-split";
import { getCalculatedTotalCents } from "./calculations/validation";

/**
 * The total that's actually being split. Equal split uses the receipt
 * total the user entered (falling back to the calculated total if it was
 * never set); itemized split always uses the calculated total, since its
 * per-person totals are built from the structured items + adjustments.
 */
export function getEffectiveTotalCents(draft: BillDraft): number {
  if (draft.splitMode === "itemized") {
    return getCalculatedTotalCents(draft.items, draft.adjustments);
  }
  return draft.enteredTotalCents ?? getCalculatedTotalCents(draft.items, draft.adjustments);
}

export function getSplitResultForDraft(draft: BillDraft): SplitResult {
  if (draft.splitMode === "equal") {
    return calculateEqualSplit(
      getEffectiveTotalCents(draft),
      draft.people,
      draft.excludedPersonIds
    );
  }
  return calculateItemizedSplit(draft.items, draft.assignments, draft.people, draft.adjustments);
}
