"use client";

import { Plus, Receipt } from "lucide-react";
import type { ReceiptItem } from "@/types/bill";
import { ItemRow } from "./item-row";

type ItemListProps = {
  items: ReceiptItem[];
  showErrors: boolean;
  lastAddedItemId: string | null;
  onUpdate: (id: string, patch: Partial<Omit<ReceiptItem, "id">>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export function ItemList({
  items,
  showErrors,
  lastAddedItemId,
  onUpdate,
  onDuplicate,
  onDelete,
  onAdd,
}: ItemListProps) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <Receipt className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No items yet. Add what&apos;s on the receipt.</p>
        </div>
      ) : (
        items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            showErrors={showErrors}
            autoFocus={item.id === lastAddedItemId}
            onUpdate={(patch) => onUpdate(item.id, patch)}
            onDuplicate={() => onDuplicate(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))
      )}

      <button
        type="button"
        onClick={onAdd}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-primary transition-colors hover:bg-accent"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add item
      </button>
    </div>
  );
}
