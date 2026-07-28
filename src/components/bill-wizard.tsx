"use client";

import { useBillDraft } from "@/hooks/use-bill-draft";
import { AppShell } from "@/components/layout/app-shell";
import { StepProgress } from "@/components/layout/step-progress";
import { BillStep } from "@/components/bill/bill-step";
import { PeopleStep } from "@/components/people/people-step";
import { AssignStep } from "@/components/assignments/assign-step";
import { SummaryStep } from "@/components/summary/summary-step";

export function BillWizard() {
  const { draft, dispatch, hydrated } = useBillDraft();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center" role="status">
          <div
            className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden="true"
          />
          <span className="sr-only">Loading your bill…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StepProgress step={draft.step} />
      {draft.step === "bill" && (
        <BillStep
          draft={draft}
          dispatch={dispatch}
          onContinue={() => dispatch({ type: "SET_STEP", step: "people" })}
        />
      )}
      {draft.step === "people" && (
        <PeopleStep
          draft={draft}
          dispatch={dispatch}
          onBack={() => dispatch({ type: "SET_STEP", step: "bill" })}
          onContinue={() => dispatch({ type: "SET_STEP", step: "assign" })}
        />
      )}
      {draft.step === "assign" && (
        <AssignStep
          draft={draft}
          dispatch={dispatch}
          onBack={() => dispatch({ type: "SET_STEP", step: "people" })}
          onContinue={() => dispatch({ type: "SET_STEP", step: "summary" })}
        />
      )}
      {draft.step === "summary" && <SummaryStep draft={draft} dispatch={dispatch} />}
    </AppShell>
  );
}
