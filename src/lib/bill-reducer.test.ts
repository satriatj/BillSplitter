import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "./bill-draft";
import { billDraftReducer } from "./bill-reducer";

describe("billDraftReducer", () => {
  it("removing a person strips them from assignments and excluded list", () => {
    let state = createEmptyDraft();
    state = billDraftReducer(state, { type: "ADD_PERSON", name: "Jason" });
    const jason = state.people[1]!;
    const you = state.people[0]!;

    state = billDraftReducer(state, { type: "ADD_ITEM" });
    const item = state.items[0]!;
    state = billDraftReducer(state, {
      type: "SET_ITEM_ASSIGNMENT",
      itemId: item.id,
      personIds: [you.id, jason.id],
    });
    state = billDraftReducer(state, { type: "TOGGLE_EXCLUDED_PERSON", id: jason.id });

    state = billDraftReducer(state, { type: "REMOVE_PERSON", id: jason.id });

    expect(state.people.find((p) => p.id === jason.id)).toBeUndefined();
    expect(state.excludedPersonIds).not.toContain(jason.id);
    expect(state.assignments[0]!.personIds).toEqual([you.id]);
  });

  it("reassigns the payer when the payer is removed", () => {
    let state = createEmptyDraft();
    state = billDraftReducer(state, { type: "ADD_PERSON", name: "Jason" });
    const you = state.people[0]!;
    expect(state.payerId).toBe(you.id);

    state = billDraftReducer(state, { type: "REMOVE_PERSON", id: you.id });
    expect(state.payerId).toBe(state.people[0]!.id);
    expect(state.payerId).not.toBe(you.id);
  });

  it("sets payer to null when the last person is removed", () => {
    let state = createEmptyDraft();
    const you = state.people[0]!;
    state = billDraftReducer(state, { type: "REMOVE_PERSON", id: you.id });
    expect(state.people).toEqual([]);
    expect(state.payerId).toBeNull();
  });

  it("duplicating an item inserts a copy right after the original with a new id", () => {
    let state = createEmptyDraft();
    state = billDraftReducer(state, { type: "ADD_ITEM" });
    const original = state.items[0]!;
    state = billDraftReducer(state, {
      type: "UPDATE_ITEM",
      id: original.id,
      patch: { name: "Burger", quantity: 2, unitPriceCents: 1200 },
    });

    state = billDraftReducer(state, { type: "DUPLICATE_ITEM", id: original.id });

    expect(state.items).toHaveLength(2);
    expect(state.items[1]!.name).toBe("Burger");
    expect(state.items[1]!.id).not.toBe(original.id);
  });

  it("deleting an item also removes its assignment", () => {
    let state = createEmptyDraft();
    state = billDraftReducer(state, { type: "ADD_ITEM" });
    const item = state.items[0]!;
    state = billDraftReducer(state, {
      type: "SET_ITEM_ASSIGNMENT",
      itemId: item.id,
      personIds: [state.people[0]!.id],
    });

    state = billDraftReducer(state, { type: "DELETE_ITEM", id: item.id });

    expect(state.items).toEqual([]);
    expect(state.assignments.find((a) => a.itemId === item.id)).toBeUndefined();
  });

  it("changing an adjustment clears the mismatch acknowledgement", () => {
    let state = createEmptyDraft();
    state = { ...state, totalMismatchAcknowledged: true };
    state = billDraftReducer(state, { type: "SET_ADJUSTMENT_CENTS", key: "taxCents", cents: 100 });
    expect(state.totalMismatchAcknowledged).toBe(false);
  });

  it("RESET returns a brand new empty draft", () => {
    let state = createEmptyDraft();
    state = billDraftReducer(state, { type: "SET_NAME", name: "Dinner" });
    const reset = billDraftReducer(state, { type: "RESET" });
    expect(reset.name).toBe("");
    expect(reset.id).not.toBe(state.id);
  });
});
