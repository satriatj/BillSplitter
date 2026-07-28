"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { BillDraft } from "@/types/bill";
import { createEmptyDraft } from "@/lib/bill-draft";
import { billDraftReducer, type BillDraftAction } from "@/lib/bill-reducer";
import { loadDraft, saveDraft } from "@/lib/storage";

/**
 * Owns the active BillDraft: a reducer for in-memory edits, plus
 * localStorage persistence. The very first client render always starts
 * from a fresh empty draft (matching the server render) and then, in an
 * effect, swaps in whatever was saved — this avoids hydration mismatches
 * at the cost of a one-frame flash when a draft is restored.
 */
export function useBillDraft() {
  const [draft, dispatch] = useReducer(billDraftReducer, undefined, createEmptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const saved = loadDraft();
    if (saved) {
      dispatch({ type: "LOAD_DRAFT", draft: saved });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft(draft);
  }, [draft, hydrated]);

  const act = useCallback((action: BillDraftAction) => dispatch(action), []);

  return { draft, dispatch: act, hydrated };
}

export type UseBillDraftReturn = ReturnType<typeof useBillDraft>;
export type { BillDraft };
