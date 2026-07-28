"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomBar } from "@/components/layout/bottom-bar";
import { formatCents } from "@/lib/currency";
import { findUnassignedItemIds, getItemLineTotalCents } from "@/lib/calculations/validation";
import { cn } from "@/lib/utils";
import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";
import { PersonChip } from "./person-chip";
import { ViewAllItemsDialog } from "./view-all-items-dialog";

type ItemizedSplitViewProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ItemizedSplitView({ draft, dispatch, onBack, onContinue }: ItemizedSplitViewProps) {
  const { items, people, assignments } = draft;
  const [index, setIndex] = useState(0);
  const [finishError, setFinishError] = useState<string | null>(null);

  const currentIndex = Math.min(index, Math.max(items.length - 1, 0));
  const currentItem = items[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === items.length - 1;

  const unassignedItemIds = findUnassignedItemIds(items, assignments);

  if (!currentItem) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        No items to assign. Go back and add items to the bill.
      </div>
    );
  }

  const currentAssignment = assignments.find((a) => a.itemId === currentItem.id)?.personIds ?? [];
  const previousItem = items[currentIndex - 1];
  const previousAssignment = previousItem
    ? assignments.find((a) => a.itemId === previousItem.id)?.personIds ?? []
    : [];
  const allSelected = people.length > 0 && currentAssignment.length === people.length;
  const isUnassigned = currentAssignment.length === 0;

  const setAssignment = (personIds: string[]) => {
    dispatch({ type: "SET_ITEM_ASSIGNMENT", itemId: currentItem.id, personIds });
  };

  const togglePerson = (personId: string) => {
    const next = currentAssignment.includes(personId)
      ? currentAssignment.filter((id) => id !== personId)
      : [...currentAssignment, personId];
    setAssignment(next);
  };

  const goTo = (next: number) => {
    setFinishError(null);
    setIndex(Math.max(0, Math.min(items.length - 1, next)));
  };

  const handleFinish = () => {
    if (unassignedItemIds.length > 0) {
      const firstUnassignedIndex = items.findIndex((item) => item.id === unassignedItemIds[0]);
      setFinishError(
        `${unassignedItemIds.length} item${unassignedItemIds.length === 1 ? "" : "s"} still need${
          unassignedItemIds.length === 1 ? "s" : ""
        } people assigned.`
      );
      if (firstUnassignedIndex !== -1) setIndex(firstUnassignedIndex);
      return;
    }
    onContinue();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 pt-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Back to people
          </button>
          <ViewAllItemsDialog
            items={items}
            assignments={assignments}
            people={people}
            onJumpToItem={goTo}
          />
        </div>

        <div className="space-y-1 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Item {currentIndex + 1} of {items.length}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {currentItem.name || "Untitled item"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentItem.quantity !== 1 ? `${currentItem.quantity} × ` : ""}
            {formatCents(currentItem.unitPriceCents)}
            {" · "}
            <span className="font-semibold text-foreground">
              {formatCents(getItemLineTotalCents(currentItem))}
            </span>
          </p>
        </div>

        {isUnassigned && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            role="alert"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            Not assigned yet — pick who shared this item.
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <PersonChip
            name="Everyone"
            selected={allSelected}
            onToggle={() => setAssignment(allSelected ? [] : people.map((p) => p.id))}
            className={cn(!allSelected && "border-dashed")}
          />
          {people.map((person) => (
            <PersonChip
              key={person.id}
              name={person.name}
              selected={currentAssignment.includes(person.id)}
              onToggle={() => togglePerson(person.id)}
            />
          ))}
        </div>

        {!isFirst && previousAssignment.length > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setAssignment(previousAssignment)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              <Users className="size-3.5" aria-hidden="true" />
              Same as previous item
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label="Previous item"
            disabled={isFirst}
            onClick={() => goTo(currentIndex - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {unassignedItemIds.length > 0
              ? `${unassignedItemIds.length} unassigned`
              : "All items assigned"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label="Next item"
            disabled={isLast}
            onClick={() => goTo(currentIndex + 1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {finishError && (
          <p className="text-center text-xs text-destructive" role="alert">
            {finishError}
          </p>
        )}
      </div>

      <BottomBar>
        <Button type="button" variant="outline" size="lg" className="h-12 flex-1 text-base" onClick={onBack}>
          Back
        </Button>
        {isLast ? (
          <Button type="button" size="lg" className="h-12 flex-[2] text-base" onClick={handleFinish}>
            Review & finish
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="h-12 flex-[2] text-base"
            onClick={() => goTo(currentIndex + 1)}
          >
            Next item
          </Button>
        )}
      </BottomBar>
    </div>
  );
}
