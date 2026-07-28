"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BottomBar } from "@/components/layout/bottom-bar";
import { getItemsSubtotalCents, getTotalMismatch, validateReceiptItem } from "@/lib/calculations/validation";
import { createEmptyReceiptItem } from "@/lib/bill-draft";
import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";
import { ItemList } from "./item-list";
import { BillTotalsForm } from "./bill-totals-form";

type BillStepProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
  onContinue: () => void;
};

export function BillStep({ draft, dispatch, onContinue }: BillStepProps) {
  const [showErrors, setShowErrors] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  const itemErrors = draft.items.map((item) => validateReceiptItem(item));
  const itemsAreValid = draft.items.length > 0 && itemErrors.every((errs) => errs.length === 0);
  const { mismatched } = getTotalMismatch(draft.items, draft.adjustments, draft.enteredTotalCents);
  const blockedByMismatch = mismatched && !draft.totalMismatchAcknowledged;

  const handleContinue = () => {
    setShowErrors(true);
    if (!itemsAreValid || blockedByMismatch) return;
    if (draft.enteredTotalCents === null) {
      dispatch({
        type: "USE_CALCULATED_TOTAL",
        calculatedTotalCents: getItemsSubtotalCents(draft.items) +
          draft.adjustments.taxCents +
          draft.adjustments.tipCents +
          draft.adjustments.feeCents -
          draft.adjustments.discountCents,
      });
    }
    onContinue();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Enter the bill</h1>
          <p className="text-sm text-muted-foreground">Add what&apos;s on the receipt.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bill-name">Restaurant or bill name (optional)</Label>
          <Input
            id="bill-name"
            value={draft.name}
            onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
            placeholder="e.g. Dinner at Hawi"
            className="h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Items</h2>
          <ItemList
            items={draft.items}
            showErrors={showErrors}
            lastAddedItemId={lastAddedItemId}
            onAdd={() => {
              const item = createEmptyReceiptItem();
              dispatch({ type: "ADD_ITEM", item });
              setLastAddedItemId(item.id);
            }}
            onUpdate={(id, patch) => dispatch({ type: "UPDATE_ITEM", id, patch })}
            onDuplicate={(id) => dispatch({ type: "DUPLICATE_ITEM", id })}
            onDelete={(id) => dispatch({ type: "DELETE_ITEM", id })}
          />
          {showErrors && draft.items.length === 0 && (
            <p className="text-xs text-destructive" role="alert">
              Add at least one item to continue.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Totals</h2>
          <BillTotalsForm
            items={draft.items}
            enteredSubtotalCents={draft.enteredSubtotalCents}
            adjustments={draft.adjustments}
            enteredTotalCents={draft.enteredTotalCents}
            totalMismatchAcknowledged={draft.totalMismatchAcknowledged}
            onEnteredSubtotalChange={(cents) =>
              dispatch({ type: "SET_ENTERED_SUBTOTAL_CENTS", cents })
            }
            onAdjustmentChange={(key, cents) => dispatch({ type: "SET_ADJUSTMENT_CENTS", key, cents })}
            onEnteredTotalChange={(cents) => dispatch({ type: "SET_ENTERED_TOTAL_CENTS", cents })}
            onUseCalculatedTotal={() =>
              dispatch({
                type: "USE_CALCULATED_TOTAL",
                calculatedTotalCents: getTotalMismatch(draft.items, draft.adjustments, null)
                  .calculatedTotalCents,
              })
            }
            onAcknowledgeMismatch={() => dispatch({ type: "ACK_TOTAL_MISMATCH" })}
          />
        </div>
      </div>

      <BottomBar>
        <Button type="button" size="lg" className="h-12 w-full text-base" onClick={handleContinue}>
          Continue to people
        </Button>
      </BottomBar>
    </div>
  );
}
