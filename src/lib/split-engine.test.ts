import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "./bill-draft";
import { getEffectiveTotalCents, getSplitResultForDraft } from "./split-engine";

describe("getEffectiveTotalCents", () => {
  it("uses the entered total for equal split", () => {
    const draft = createEmptyDraft();
    draft.splitMode = "equal";
    draft.enteredTotalCents = 5000;
    expect(getEffectiveTotalCents(draft)).toBe(5000);
  });

  it("falls back to the calculated total for equal split when nothing was entered", () => {
    const draft = createEmptyDraft();
    draft.splitMode = "equal";
    draft.enteredTotalCents = null;
    draft.items = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    expect(getEffectiveTotalCents(draft)).toBe(1000);
  });

  it("always uses the calculated total for itemized split, ignoring enteredTotalCents", () => {
    const draft = createEmptyDraft();
    draft.splitMode = "itemized";
    draft.enteredTotalCents = 99999;
    draft.items = [{ id: "i1", name: "A", quantity: 1, unitPriceCents: 1000 }];
    draft.adjustments = { taxCents: 100, tipCents: 0, feeCents: 0, discountCents: 0 };
    expect(getEffectiveTotalCents(draft)).toBe(1100);
  });
});

describe("getSplitResultForDraft", () => {
  it("routes to the equal split engine", () => {
    const draft = createEmptyDraft();
    draft.splitMode = "equal";
    draft.enteredTotalCents = 1000;
    draft.people = [
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ];
    const result = getSplitResultForDraft(draft);
    expect(result.breakdowns.map((b) => b.totalCents)).toEqual([500, 500]);
  });

  it("routes to the itemized split engine", () => {
    const draft = createEmptyDraft();
    draft.splitMode = "itemized";
    draft.people = [
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ];
    draft.items = [{ id: "i1", name: "Item", quantity: 1, unitPriceCents: 1000 }];
    draft.assignments = [{ itemId: "i1", personIds: ["p1"] }];
    const result = getSplitResultForDraft(draft);
    expect(result.breakdowns.find((b) => b.personId === "p1")?.totalCents).toBe(1000);
    expect(result.breakdowns.find((b) => b.personId === "p2")?.totalCents).toBe(0);
  });
});
