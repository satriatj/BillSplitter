/**
 * Domain types for the bill-splitting engine.
 *
 * All monetary values are integer cents. Never use floating-point
 * arithmetic directly on money — see src/lib/currency.ts.
 */

export type SplitMode = "equal" | "itemized";

export type Person = {
  id: string;
  name: string;
};

export type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

/** Which people share a given item. An empty personIds list means unassigned. */
export type ItemAssignment = {
  itemId: string;
  personIds: string[];
};

export type BillAdjustments = {
  taxCents: number;
  tipCents: number;
  feeCents: number;
  discountCents: number;
};

export type PersonBreakdown = {
  personId: string;
  /** Items (and shares of shared items) assigned to this person. */
  itemSubtotalCents: number;
  taxCents: number;
  tipCents: number;
  feeCents: number;
  discountCents: number;
  totalCents: number;
};

/** Per-item detail used to render "assigned items" in the summary. */
export type PersonItemDetail = {
  itemId: string;
  itemName: string;
  quantity: number;
  /** Full line total for the item (quantity * unitPrice), before splitting among sharers. */
  lineTotalCents: number;
  /** How many people share this item. */
  sharedWith: number;
  /** This person's share of the item's line total. */
  shareCents: number;
};

export type SplitResult = {
  breakdowns: PersonBreakdown[];
  itemDetails: Record<string, PersonItemDetail[]>;
};

/** The full state of an in-progress or completed bill draft. */
export type BillDraft = {
  id: string;
  name: string;
  items: ReceiptItem[];
  /** Subtotal as entered on the receipt, in cents (may differ from the calculated items subtotal). */
  enteredSubtotalCents: number | null;
  adjustments: BillAdjustments;
  /** Total as printed on the receipt, in cents. */
  enteredTotalCents: number | null;
  /** True once the user has acknowledged a subtotal/total mismatch warning. */
  totalMismatchAcknowledged: boolean;
  people: Person[];
  payerId: string | null;
  splitMode: SplitMode;
  /** Person IDs excluded from an equal split. Ignored in itemized mode. */
  excludedPersonIds: string[];
  assignments: ItemAssignment[];
  step: WizardStep;
  createdAt: string;
  updatedAt: string;
};

export type WizardStep = "bill" | "people" | "assign" | "summary";

export const WIZARD_STEPS: WizardStep[] = ["bill", "people", "assign", "summary"];
