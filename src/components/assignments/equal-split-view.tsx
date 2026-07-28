"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomBar } from "@/components/layout/bottom-bar";
import { calculateEqualSplit } from "@/lib/calculations/equal-split";
import { getEffectiveTotalCents } from "@/lib/split-engine";
import { formatCents } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";

type EqualSplitViewProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function EqualSplitView({ draft, dispatch, onBack, onContinue }: EqualSplitViewProps) {
  const totalCents = getEffectiveTotalCents(draft);
  const { breakdowns } = calculateEqualSplit(totalCents, draft.people, draft.excludedPersonIds);
  const shareByPersonId = new Map(breakdowns.map((b) => [b.personId, b.totalCents]));
  const includedCount = draft.people.length - draft.excludedPersonIds.length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Split evenly</h1>
          <p className="text-sm text-muted-foreground">
            {formatCents(totalCents)} divided among {includedCount} {includedCount === 1 ? "person" : "people"}.
          </p>
        </div>

        <div className="space-y-2">
          {draft.people.map((person) => {
            const isExcluded = draft.excludedPersonIds.includes(person.id);
            const share = shareByPersonId.get(person.id) ?? 0;
            return (
              <button
                key={person.id}
                type="button"
                aria-pressed={!isExcluded}
                onClick={() => dispatch({ type: "TOGGLE_EXCLUDED_PERSON", id: person.id })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                  isExcluded
                    ? "border-border bg-card opacity-60"
                    : "border-primary bg-accent"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    isExcluded ? "border-muted-foreground/40" : "border-primary bg-primary text-primary-foreground"
                  )}
                  aria-hidden="true"
                >
                  {!isExcluded && <Check className="size-3.5" />}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {person.name.trim() || "Unnamed"}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {isExcluded ? "Not included" : formatCents(share)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomBar>
        <Button type="button" variant="outline" size="lg" className="h-12 flex-1 text-base" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 flex-[2] text-base"
          disabled={includedCount === 0}
          onClick={onContinue}
        >
          See summary
        </Button>
      </BottomBar>
    </div>
  );
}
