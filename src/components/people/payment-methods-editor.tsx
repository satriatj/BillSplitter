"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createPaymentMethod } from "@/lib/bill-draft";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_TYPES,
  formatPaymentMethod,
} from "@/lib/payment-methods";
import type { PaymentMethod, PaymentMethodType } from "@/types/bill";

const VALUE_PLACEHOLDERS: Record<PaymentMethodType, string> = {
  venmo: "@handle",
  zelle: "Phone or email",
  paypal: "@handle or email",
  cashapp: "$cashtag",
  other: "e.g. bank transfer, cash",
};

type PaymentMethodsEditorProps = {
  payerName: string;
  methods: PaymentMethod[];
  onAdd: (method: PaymentMethod) => void;
  onRemove: (methodId: string) => void;
};

export function PaymentMethodsEditor({
  payerName,
  methods,
  onAdd,
  onRemove,
}: PaymentMethodsEditorProps) {
  const [type, setType] = useState<PaymentMethodType>("venmo");
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    onAdd(createPaymentMethod(type, trimmed));
    setValue("");
  };

  return (
    <div className="space-y-2 pt-1">
      <Label>How should people pay {payerName || "them"} back? (optional)</Label>

      {methods.length > 0 && (
        <ul className="space-y-1.5">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{formatPaymentMethod(method)}</span>
              <button
                type="button"
                onClick={() => onRemove(method.id)}
                aria-label={`Remove ${formatPaymentMethod(method)}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Payment method type">
        {PAYMENT_METHOD_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn(
              "h-11 rounded-full border-2 px-3.5 text-sm font-medium transition-colors",
              type === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent"
            )}
          >
            {PAYMENT_METHOD_LABELS[t]}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <Label htmlFor="payment-method-value" className="sr-only">
          {PAYMENT_METHOD_LABELS[type]} details
        </Label>
        <Input
          id="payment-method-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={VALUE_PLACEHOLDERS[type]}
          className="h-11 flex-1 text-base"
        />
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          className="h-11 w-11 shrink-0"
          aria-label={`Add ${PAYMENT_METHOD_LABELS[type]}`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
