"use client";

import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";
import { EqualSplitView } from "./equal-split-view";
import { ItemizedSplitView } from "./itemized-split-view";

type AssignStepProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function AssignStep({ draft, dispatch, onBack, onContinue }: AssignStepProps) {
  if (draft.splitMode === "equal") {
    return <EqualSplitView draft={draft} dispatch={dispatch} onBack={onBack} onContinue={onContinue} />;
  }
  return <ItemizedSplitView draft={draft} dispatch={dispatch} onBack={onBack} onContinue={onContinue} />;
}
