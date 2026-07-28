"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { PersonBreakdown, PersonItemDetail, SplitMode } from "@/types/bill";

type PersonSummaryCardProps = {
  name: string;
  breakdown: PersonBreakdown;
  itemDetails: PersonItemDetail[];
  splitMode: SplitMode;
  isPayer: boolean;
};

function DetailRow({ label, valueCents, negative }: { label: string; valueCents: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        {negative && valueCents > 0 ? "−" : ""}
        {formatCents(valueCents)}
      </span>
    </div>
  );
}

export function PersonSummaryCard({
  name,
  breakdown,
  itemDetails,
  splitMode,
  isPayer,
}: PersonSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-3 text-left"
      >
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{name}</span>
            {isPayer && (
              <Badge variant="secondary" className="text-[10px]">
                Paid the bill
              </Badge>
            )}
          </span>
        </span>
        <span className="text-sm font-semibold tabular-nums">{formatCents(breakdown.totalCents)}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border px-3 pb-3 pt-2">
          {splitMode === "itemized" ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Assigned items</p>
                {itemDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items assigned.</p>
                ) : (
                  <ul className="space-y-0.5">
                    {itemDetails.map((detail) => (
                      <li key={detail.itemId} className="flex items-center justify-between text-sm">
                        <span className="min-w-0 truncate pr-2">
                          {detail.itemName || "Untitled item"}
                          {detail.quantity !== 1 ? ` ×${detail.quantity}` : ""}
                          {detail.sharedWith > 1 ? ` (split ${detail.sharedWith} ways)` : ""}
                        </span>
                        <span className="shrink-0 tabular-nums">{formatCents(detail.shareCents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-1 border-t border-dashed border-border pt-2">
                <DetailRow label="Item subtotal" valueCents={breakdown.itemSubtotalCents} />
                <DetailRow label="Tax share" valueCents={breakdown.taxCents} />
                <DetailRow label="Tip share" valueCents={breakdown.tipCents} />
                <DetailRow label="Fee share" valueCents={breakdown.feeCents} />
                <DetailRow label="Discount share" valueCents={breakdown.discountCents} negative />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Equal share of the total.</p>
          )}
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
            <span>Final total</span>
            <span className="tabular-nums">{formatCents(breakdown.totalCents)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
