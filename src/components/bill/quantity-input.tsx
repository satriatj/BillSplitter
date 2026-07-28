"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityInputProps = {
  value: number;
  onChange: (quantity: number) => void;
  "aria-label"?: string;
};

function sanitize(raw: string): string {
  let digitsOnly = raw.replace(/[^0-9.]/g, "");
  const firstDot = digitsOnly.indexOf(".");
  if (firstDot !== -1) {
    digitsOnly =
      digitsOnly.slice(0, firstDot + 1) + digitsOnly.slice(firstDot + 1).replace(/\./g, "");
  }
  const [whole = "", frac] = digitsOnly.split(".");
  return frac !== undefined ? `${whole}.${frac.slice(0, 2)}` : whole;
}

/** A small stepper + free-text field for item quantity (supports fractional quantities like 0.5 lb). */
export function QuantityInput({ value, onChange, ...aria }: QuantityInputProps) {
  const [text, setText] = React.useState(() => String(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(String(value));
  }, [value, focused]);

  const commit = (next: number) => {
    if (Number.isFinite(next) && next > 0) {
      onChange(Math.round(next * 100) / 100);
    }
  };

  return (
    <div className="flex h-11 items-center rounded-lg border border-input bg-transparent">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
        disabled={value <= 1}
        onClick={() => commit(Math.max(1, value - 1))}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        className="h-11 w-11 border-x border-input bg-transparent text-center text-base tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const parsed = Number(text);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            setText(String(value));
          } else {
            commit(parsed);
          }
        }}
        onChange={(event) => {
          const sanitized = sanitize(event.target.value);
          setText(sanitized);
          const parsed = Number(sanitized);
          if (sanitized !== "" && sanitized !== "." && Number.isFinite(parsed) && parsed > 0) {
            onChange(parsed);
          }
        }}
        {...aria}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => commit(value + 1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
