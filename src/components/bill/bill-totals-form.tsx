"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/currency";
import { getItemsSubtotalCents, getTotalMismatch } from "@/lib/calculations/validation";
import type { BillAdjustments, ReceiptItem } from "@/types/bill";

type BillTotalsFormProps = {
  items: ReceiptItem[];
  enteredSubtotalCents: number | null;
  adjustments: BillAdjustments;
  enteredTotalCents: number | null;
  totalMismatchAcknowledged: boolean;
  onEnteredSubtotalChange: (cents: number | null) => void;
  onAdjustmentChange: (key: keyof BillAdjustments, cents: number) => void;
  onEnteredTotalChange: (cents: number | null) => void;
  onUseCalculatedTotal: () => void;
  onAcknowledgeMismatch: () => void;
};

export function BillTotalsForm({
  items,
  enteredSubtotalCents,
  adjustments,
  enteredTotalCents,
  totalMismatchAcknowledged,
  onEnteredSubtotalChange,
  onAdjustmentChange,
  onEnteredTotalChange,
  onUseCalculatedTotal,
  onAcknowledgeMismatch,
}: BillTotalsFormProps) {
  const itemsSubtotalCents = getItemsSubtotalCents(items);
  const { mismatched, calculatedTotalCents, differenceCents } = getTotalMismatch(
    items,
    adjustments,
    enteredTotalCents
  );
  const showWarning = mismatched && !totalMismatchAcknowledged;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
        <span className="text-sm text-secondary-foreground">Items subtotal</span>
        <span className="text-sm font-semibold tabular-nums">{formatCents(itemsSubtotalCents)}</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="entered-subtotal">Subtotal on receipt (optional)</Label>
        <CurrencyInput
          id="entered-subtotal"
          value={enteredSubtotalCents}
          onChange={onEnteredSubtotalChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tax">Tax</Label>
          <CurrencyInput
            id="tax"
            value={adjustments.taxCents || null}
            onChange={(cents) => onAdjustmentChange("taxCents", cents ?? 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tip">Tip</Label>
          <CurrencyInput
            id="tip"
            value={adjustments.tipCents || null}
            onChange={(cents) => onAdjustmentChange("tipCents", cents ?? 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fee">Fee / service charge</Label>
          <CurrencyInput
            id="fee"
            value={adjustments.feeCents || null}
            onChange={(cents) => onAdjustmentChange("feeCents", cents ?? 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount</Label>
          <CurrencyInput
            id="discount"
            value={adjustments.discountCents || null}
            onChange={(cents) => onAdjustmentChange("discountCents", cents ?? 0)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="entered-total">Receipt total</Label>
        <CurrencyInput id="entered-total" value={enteredTotalCents} onChange={onEnteredTotalChange} />
        <p className="text-xs text-muted-foreground">
          Calculated total: <span className="tabular-nums">{formatCents(calculatedTotalCents)}</span>
        </p>
      </div>

      {showWarning && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Total doesn&apos;t match</AlertTitle>
          <AlertDescription>
            <p>
              Items + tax + tip + fees − discount = {formatCents(calculatedTotalCents)}, but you
              entered {formatCents(enteredTotalCents ?? 0)} ({differenceCents > 0 ? "+" : ""}
              {formatCents(differenceCents)} difference). Receipts sometimes have unusual
              adjustments — you can continue anyway.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={onUseCalculatedTotal}>
                Use calculated total
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={onAcknowledgeMismatch}>
                Continue anyway
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
