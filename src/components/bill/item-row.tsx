"use client";

import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/currency";
import { getItemLineTotalCents } from "@/lib/calculations/validation";
import type { ReceiptItem } from "@/types/bill";
import { QuantityInput } from "./quantity-input";

type ItemRowProps = {
  item: ReceiptItem;
  index: number;
  showErrors: boolean;
  autoFocus?: boolean;
  onUpdate: (patch: Partial<Omit<ReceiptItem, "id">>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function ItemRow({
  item,
  index,
  showErrors,
  autoFocus,
  onUpdate,
  onDuplicate,
  onDelete,
}: ItemRowProps) {
  const lineTotalCents = getItemLineTotalCents(item);
  const nameError = showErrors && item.name.trim() === "" ? "Enter an item name" : null;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Label htmlFor={`item-name-${item.id}`} className="sr-only">
            Item {index + 1} name
          </Label>
          <Input
            id={`item-name-${item.id}`}
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Item name"
            autoFocus={autoFocus}
            className="h-11 text-base font-medium"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? `item-name-error-${item.id}` : undefined}
          />
          {nameError && (
            <p id={`item-name-error-${item.id}`} className="mt-1 text-xs text-destructive" role="alert">
              {nameError}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${item.name || `item ${index + 1}`}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <QuantityInput
          value={item.quantity}
          onChange={(quantity) => onUpdate({ quantity })}
          aria-label={`Quantity for ${item.name || `item ${index + 1}`}`}
        />
        <CurrencyInput
          value={item.unitPriceCents || null}
          onChange={(cents) => onUpdate({ unitPriceCents: cents ?? 0 })}
          className="flex-1"
          aria-label={`Unit price for ${item.name || `item ${index + 1}`}`}
          placeholder="Price"
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex h-9 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Duplicate
        </button>
        <span className="text-sm font-semibold tabular-nums">{formatCents(lineTotalCents)}</span>
      </div>
    </div>
  );
}
