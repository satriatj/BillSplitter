"use client";

import { AlertTriangle, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCents } from "@/lib/currency";
import { getItemLineTotalCents } from "@/lib/calculations/validation";
import type { ItemAssignment, Person, ReceiptItem } from "@/types/bill";

type ViewAllItemsDialogProps = {
  items: ReceiptItem[];
  assignments: ItemAssignment[];
  people: Person[];
  onJumpToItem: (index: number) => void;
};

export function ViewAllItemsDialog({
  items,
  assignments,
  people,
  onJumpToItem,
}: ViewAllItemsDialogProps) {
  const nameById = new Map(people.map((p) => [p.id, p.name.trim() || "Unnamed"]));
  const assignmentByItemId = new Map(assignments.map((a) => [a.itemId, a]));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <List className="size-3.5" aria-hidden="true" />
          View all items
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>All items</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {items.map((item, index) => {
            const personIds = assignmentByItemId.get(item.id)?.personIds ?? [];
            const isUnassigned = personIds.length === 0;
            const names = personIds.map((id) => nameById.get(id) ?? "Unknown").join(", ");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onJumpToItem(index)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.name || "Untitled item"}</span>
                  <span
                    className={`flex items-center gap-1 truncate text-xs ${
                      isUnassigned ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {isUnassigned && <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />}
                    {isUnassigned ? "Unassigned" : names}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCents(getItemLineTotalCents(item))}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
