import type { BillDraft } from "@/types/bill";

const STORAGE_KEY = "billsplitter:draft";
export const DRAFT_SCHEMA_VERSION = 1;

type StoredDraft = {
  schemaVersion: number;
  draft: BillDraft;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Structural validation for data coming out of localStorage. We don't trust
 * it: it could be from an older schema version, hand-edited, or corrupted.
 * Anything that doesn't look like a well-formed BillDraft is discarded so
 * the app falls back to a fresh draft instead of crashing.
 */
function isValidStoredDraft(value: unknown): value is StoredDraft {
  if (!isPlainObject(value)) return false;
  if (value.schemaVersion !== DRAFT_SCHEMA_VERSION) return false;
  if (!isPlainObject(value.draft)) return false;

  const draft = value.draft;
  return (
    typeof draft.id === "string" &&
    typeof draft.name === "string" &&
    Array.isArray(draft.items) &&
    Array.isArray(draft.people) &&
    Array.isArray(draft.assignments) &&
    Array.isArray(draft.excludedPersonIds) &&
    isPlainObject(draft.adjustments) &&
    (draft.splitMode === "equal" || draft.splitMode === "itemized") &&
    ["bill", "people", "assign", "summary"].includes(draft.step as string) &&
    typeof draft.createdAt === "string" &&
    typeof draft.updatedAt === "string"
  );
}

/** Persist the active draft. Fails silently if storage is full or unavailable (e.g. private browsing). */
export function saveDraft(draft: BillDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = { schemaVersion: DRAFT_SCHEMA_VERSION, draft };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore write failures — persistence is a nice-to-have, not a requirement.
  }
}

/** Load a previously saved draft, or null if there isn't one or it failed validation. */
export function loadDraft(): BillDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredDraft(parsed)) return null;
    return parsed.draft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
