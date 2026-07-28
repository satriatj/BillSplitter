import type { BillDraft, PaymentMethod, PaymentMethodType, Person, ReceiptItem } from "@/types/bill";
import { createId } from "./id";

export function createEmptyReceiptItem(): ReceiptItem {
  return { id: createId(), name: "", quantity: 1, unitPriceCents: 0 };
}

export function createPerson(name: string): Person {
  return { id: createId(), name };
}

export function createPaymentMethod(type: PaymentMethodType, value: string): PaymentMethod {
  return { id: createId(), type, value };
}

export function createEmptyDraft(): BillDraft {
  const now = new Date().toISOString();
  const you = createPerson("You");
  return {
    id: createId(),
    name: "",
    items: [],
    enteredSubtotalCents: null,
    adjustments: { taxCents: 0, tipCents: 0, feeCents: 0, discountCents: 0 },
    enteredTotalCents: null,
    totalMismatchAcknowledged: false,
    people: [you],
    payerId: you.id,
    splitMode: "equal",
    excludedPersonIds: [],
    assignments: [],
    step: "bill",
    createdAt: now,
    updatedAt: now,
  };
}
