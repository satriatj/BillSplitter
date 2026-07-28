import { describe, expect, it } from "vitest";
import { createEmptyDraft, createPerson } from "./bill-draft";
import { buildSummaryText } from "./summary-text";
import type { SplitResult } from "@/types/bill";

describe("buildSummaryText", () => {
  it("matches the documented example format", () => {
    const draft = createEmptyDraft();
    draft.name = "Dinner at Hawi";
    const satria = createPerson("Satria");
    const andrew = createPerson("Andrew");
    const jason = createPerson("Jason");
    draft.people = [satria, andrew, jason];
    draft.payerId = satria.id;
    draft.enteredTotalCents = 8642;

    const result: SplitResult = {
      breakdowns: [
        { personId: satria.id, itemSubtotalCents: 3493, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 3493 },
        { personId: andrew.id, itemSubtotalCents: 2942, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 2942 },
        { personId: jason.id, itemSubtotalCents: 2207, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 2207 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text).toBe(
      [
        "Dinner at Hawi — $86.42",
        "",
        "Andrew owes Satria $29.42",
        "Jason owes Satria $22.07",
        "Satria paid and covers $34.93",
      ].join("\n")
    );
  });

  it("omits the bill name dash when no name was entered", () => {
    const draft = createEmptyDraft();
    draft.name = "";
    const you = draft.people[0]!;
    const jason = createPerson("Jason");
    draft.people = [you, jason];
    draft.payerId = you.id;
    draft.enteredTotalCents = 1000;

    const result: SplitResult = {
      breakdowns: [
        { personId: you.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
        { personId: jason.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text.startsWith("$10.00\n")).toBe(true);
  });

  it("appends a single payment method as a trailing line when present", () => {
    const draft = createEmptyDraft();
    draft.name = "Dinner at Hawi";
    const satria = createPerson("Satria");
    satria.paymentMethods = [{ id: "m1", type: "venmo", value: "@satria" }];
    const andrew = createPerson("Andrew");
    draft.people = [satria, andrew];
    draft.payerId = satria.id;
    draft.enteredTotalCents = 1000;

    const result: SplitResult = {
      breakdowns: [
        { personId: satria.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
        { personId: andrew.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text).toBe(
      [
        "Dinner at Hawi — $10.00",
        "",
        "Andrew owes Satria $5.00",
        "Satria paid and covers $5.00",
        "",
        "Pay Satria via Venmo @satria",
      ].join("\n")
    );
  });

  it("joins multiple payment methods with 'or' in the trailing line", () => {
    const draft = createEmptyDraft();
    draft.name = "Dinner at Hawi";
    const satria = createPerson("Satria");
    satria.paymentMethods = [
      { id: "m1", type: "venmo", value: "@satria" },
      { id: "m2", type: "zelle", value: "555-1234" },
    ];
    const andrew = createPerson("Andrew");
    draft.people = [satria, andrew];
    draft.payerId = satria.id;
    draft.enteredTotalCents = 1000;

    const result: SplitResult = {
      breakdowns: [
        { personId: satria.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
        { personId: andrew.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text.endsWith("Pay Satria via Venmo @satria or Zelle 555-1234")).toBe(true);
  });

  it("omits the payment info line entirely when no methods were added", () => {
    const draft = createEmptyDraft();
    const you = draft.people[0]!;
    const jason = createPerson("Jason");
    draft.people = [you, jason];
    draft.payerId = you.id;
    draft.enteredTotalCents = 1000;

    const result: SplitResult = {
      breakdowns: [
        { personId: you.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
        { personId: jason.id, itemSubtotalCents: 500, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 500 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text).not.toContain("Pay");
  });

  it("skips people excluded from an equal split (absent from breakdowns)", () => {
    const draft = createEmptyDraft();
    const you = draft.people[0]!;
    const excluded = createPerson("Excluded");
    draft.people = [you, excluded];
    draft.payerId = you.id;
    draft.enteredTotalCents = 1000;

    const result: SplitResult = {
      breakdowns: [
        { personId: you.id, itemSubtotalCents: 1000, taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0, totalCents: 1000 },
      ],
      itemDetails: {},
    };

    const text = buildSummaryText(draft, result);
    expect(text).not.toContain("Excluded");
  });
});
