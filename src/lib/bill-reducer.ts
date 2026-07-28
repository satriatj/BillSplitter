import type {
  BillAdjustments,
  BillDraft,
  PaymentMethod,
  ReceiptItem,
  SplitMode,
  WizardStep,
} from "@/types/bill";
import { createEmptyDraft, createEmptyReceiptItem, createPerson } from "./bill-draft";
import { createId } from "./id";

export type BillDraftAction =
  | { type: "LOAD_DRAFT"; draft: BillDraft }
  | { type: "RESET" }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SET_NAME"; name: string }
  | { type: "ADD_ITEM"; item?: ReceiptItem }
  | { type: "UPDATE_ITEM"; id: string; patch: Partial<Omit<ReceiptItem, "id">> }
  | { type: "DUPLICATE_ITEM"; id: string }
  | { type: "DELETE_ITEM"; id: string }
  | { type: "SET_ENTERED_SUBTOTAL_CENTS"; cents: number | null }
  | { type: "SET_ADJUSTMENT_CENTS"; key: keyof BillAdjustments; cents: number }
  | { type: "SET_ENTERED_TOTAL_CENTS"; cents: number | null }
  | { type: "USE_CALCULATED_TOTAL"; calculatedTotalCents: number }
  | { type: "ACK_TOTAL_MISMATCH" }
  | { type: "RENAME_PERSON"; id: string; name: string }
  | { type: "ADD_PAYMENT_METHOD"; personId: string; method: PaymentMethod }
  | { type: "REMOVE_PAYMENT_METHOD"; personId: string; methodId: string }
  | { type: "ADD_PERSON"; name: string }
  | { type: "REMOVE_PERSON"; id: string }
  | { type: "SET_PAYER"; id: string }
  | { type: "SET_SPLIT_MODE"; mode: SplitMode }
  | { type: "TOGGLE_EXCLUDED_PERSON"; id: string }
  | { type: "SET_ITEM_ASSIGNMENT"; itemId: string; personIds: string[] };

function touch(): Pick<BillDraft, "updatedAt"> {
  return { updatedAt: new Date().toISOString() };
}

export function billDraftReducer(state: BillDraft, action: BillDraftAction): BillDraft {
  switch (action.type) {
    case "LOAD_DRAFT":
      return action.draft;

    case "RESET":
      return createEmptyDraft();

    case "SET_STEP":
      return { ...state, step: action.step, ...touch() };

    case "SET_NAME":
      return { ...state, name: action.name, ...touch() };

    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.item ?? createEmptyReceiptItem()],
        ...touch(),
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item
        ),
        ...touch(),
      };

    case "DUPLICATE_ITEM": {
      const index = state.items.findIndex((item) => item.id === action.id);
      if (index === -1) return state;
      const original = state.items[index]!;
      const copy: ReceiptItem = { ...original, id: createId() };
      const items = [...state.items];
      items.splice(index + 1, 0, copy);
      return { ...state, items, ...touch() };
    }

    case "DELETE_ITEM": {
      const items = state.items.filter((item) => item.id !== action.id);
      const assignments = state.assignments.filter((a) => a.itemId !== action.id);
      return { ...state, items, assignments, ...touch() };
    }

    case "SET_ENTERED_SUBTOTAL_CENTS":
      return { ...state, enteredSubtotalCents: action.cents, ...touch() };

    case "SET_ADJUSTMENT_CENTS":
      return {
        ...state,
        adjustments: { ...state.adjustments, [action.key]: action.cents },
        totalMismatchAcknowledged: false,
        ...touch(),
      };

    case "SET_ENTERED_TOTAL_CENTS":
      return {
        ...state,
        enteredTotalCents: action.cents,
        totalMismatchAcknowledged: false,
        ...touch(),
      };

    case "USE_CALCULATED_TOTAL":
      return {
        ...state,
        enteredTotalCents: action.calculatedTotalCents,
        totalMismatchAcknowledged: true,
        ...touch(),
      };

    case "ACK_TOTAL_MISMATCH":
      return { ...state, totalMismatchAcknowledged: true, ...touch() };

    case "RENAME_PERSON":
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)),
        ...touch(),
      };

    case "ADD_PAYMENT_METHOD":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId
            ? { ...p, paymentMethods: [...(p.paymentMethods ?? []), action.method] }
            : p
        ),
        ...touch(),
      };

    case "REMOVE_PAYMENT_METHOD":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId
            ? { ...p, paymentMethods: (p.paymentMethods ?? []).filter((m) => m.id !== action.methodId) }
            : p
        ),
        ...touch(),
      };

    case "ADD_PERSON": {
      const person = createPerson(action.name);
      return { ...state, people: [...state.people, person], ...touch() };
    }

    case "REMOVE_PERSON": {
      const people = state.people.filter((p) => p.id !== action.id);
      const excludedPersonIds = state.excludedPersonIds.filter((id) => id !== action.id);
      const assignments = state.assignments.map((a) => ({
        ...a,
        personIds: a.personIds.filter((id) => id !== action.id),
      }));
      const payerId = state.payerId === action.id ? (people[0]?.id ?? null) : state.payerId;
      return { ...state, people, excludedPersonIds, assignments, payerId, ...touch() };
    }

    case "SET_PAYER":
      return { ...state, payerId: action.id, ...touch() };

    case "SET_SPLIT_MODE":
      return { ...state, splitMode: action.mode, ...touch() };

    case "TOGGLE_EXCLUDED_PERSON": {
      const isExcluded = state.excludedPersonIds.includes(action.id);
      const excludedPersonIds = isExcluded
        ? state.excludedPersonIds.filter((id) => id !== action.id)
        : [...state.excludedPersonIds, action.id];
      return { ...state, excludedPersonIds, ...touch() };
    }

    case "SET_ITEM_ASSIGNMENT": {
      const existingIndex = state.assignments.findIndex((a) => a.itemId === action.itemId);
      const nextAssignment = { itemId: action.itemId, personIds: action.personIds };
      const assignments =
        existingIndex === -1
          ? [...state.assignments, nextAssignment]
          : state.assignments.map((a, i) => (i === existingIndex ? nextAssignment : a));
      return { ...state, assignments, ...touch() };
    }

    default:
      return state;
  }
}
