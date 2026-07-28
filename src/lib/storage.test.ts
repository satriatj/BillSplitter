import { beforeEach, describe, expect, it } from "vitest";
import type { BillDraft } from "@/types/bill";
import { createEmptyDraft } from "./bill-draft";
import { clearDraft, DRAFT_SCHEMA_VERSION, loadDraft, saveDraft } from "./storage";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  const storage = new MemoryStorage();
  // @ts-expect-error -- test-only global shim, not the full localStorage interface
  globalThis.window = globalThis;
  // @ts-expect-error -- test-only global shim
  globalThis.localStorage = storage;
});

describe("saveDraft / loadDraft", () => {
  it("round-trips a draft through storage", () => {
    const draft = createEmptyDraft();
    draft.name = "Dinner at Hawi";
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
  });

  it("returns null when nothing has been saved", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns null and does not throw for malformed JSON", () => {
    globalThis.localStorage.setItem("billsplitter:draft", "{not json");
    expect(loadDraft()).toBeNull();
  });

  it("returns null for a schema version mismatch", () => {
    globalThis.localStorage.setItem(
      "billsplitter:draft",
      JSON.stringify({ schemaVersion: DRAFT_SCHEMA_VERSION + 1, draft: createEmptyDraft() })
    );
    expect(loadDraft()).toBeNull();
  });

  it("returns null for a structurally invalid draft", () => {
    globalThis.localStorage.setItem(
      "billsplitter:draft",
      JSON.stringify({ schemaVersion: DRAFT_SCHEMA_VERSION, draft: { foo: "bar" } })
    );
    expect(loadDraft()).toBeNull();
  });

  it("returns null when the stored value isn't an object at all", () => {
    globalThis.localStorage.setItem("billsplitter:draft", JSON.stringify(42));
    expect(loadDraft()).toBeNull();
  });
});

describe("clearDraft", () => {
  it("removes a saved draft", () => {
    const draft: BillDraft = createEmptyDraft();
    saveDraft(draft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
