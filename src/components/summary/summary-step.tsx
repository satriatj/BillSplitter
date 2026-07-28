"use client";

import { ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomBar } from "@/components/layout/bottom-bar";
import { formatCents } from "@/lib/currency";
import { getEffectiveTotalCents, getSplitResultForDraft } from "@/lib/split-engine";
import { buildSummaryText } from "@/lib/summary-text";
import { formatPaymentMethodsList } from "@/lib/payment-methods";
import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";
import { PersonSummaryCard } from "./person-summary-card";
import { CopySummaryButton } from "./copy-summary-button";
import { StartOverDialog } from "./start-over-dialog";

type SummaryStepProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
};

export function SummaryStep({ draft, dispatch }: SummaryStepProps) {
  const result = getSplitResultForDraft(draft);
  const totalCents = getEffectiveTotalCents(draft);
  const breakdownByPersonId = new Map(result.breakdowns.map((b) => [b.personId, b]));
  const nameById = new Map(draft.people.map((p) => [p.id, p.name.trim() || "Unnamed"]));
  const payerName = draft.payerId ? (nameById.get(draft.payerId) ?? "Payer") : "Payer";
  const payerBreakdown = draft.payerId ? breakdownByPersonId.get(draft.payerId) : undefined;
  const payerPaymentMethods = draft.people.find((p) => p.id === draft.payerId)?.paymentMethods ?? [];
  const payerPaymentInfo = formatPaymentMethodsList(payerPaymentMethods);

  const summaryText = buildSummaryText(draft, result);

  const peopleInBreakdown = draft.people.filter((p) => breakdownByPersonId.has(p.id));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-2">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {draft.name.trim() || "Bill summary"}
          </p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatCents(totalCents)}</p>
          <p className="text-sm text-muted-foreground">Paid by {payerName}</p>
          {payerPaymentInfo && (
            <p className="text-sm font-medium text-primary">Pay via {payerPaymentInfo}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <StartOverDialog onConfirm={() => dispatch({ type: "RESET" })} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => dispatch({ type: "SET_STEP", step: "assign" })}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit split
          </Button>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          {peopleInBreakdown
            .filter((p) => p.id !== draft.payerId)
            .map((person) => {
              const breakdown = breakdownByPersonId.get(person.id)!;
              return (
                <div key={person.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-medium">{nameById.get(person.id)}</span>
                    <span className="shrink-0 text-muted-foreground">owes</span>
                    <span className="truncate text-muted-foreground">{payerName}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatCents(breakdown.totalCents)}
                  </span>
                </div>
              );
            })}
          <div className="flex items-center justify-between gap-2 border-t border-dashed border-border pt-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate font-medium">{payerName}</span>
              <span className="shrink-0 text-muted-foreground">paid and covers</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatCents(payerBreakdown?.totalCents ?? 0)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Details by person</h2>
          <div className="space-y-2">
            {peopleInBreakdown.map((person) => (
              <PersonSummaryCard
                key={person.id}
                name={nameById.get(person.id) ?? "Unnamed"}
                breakdown={breakdownByPersonId.get(person.id)!}
                itemDetails={result.itemDetails[person.id] ?? []}
                splitMode={draft.splitMode}
                isPayer={person.id === draft.payerId}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomBar>
        <CopySummaryButton text={summaryText} />
      </BottomBar>
    </div>
  );
}
