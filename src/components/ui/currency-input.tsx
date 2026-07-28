"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { centsToDecimalString, parseOptionalCurrencyToCents } from "@/lib/currency";
import { cn } from "@/lib/utils";

type CurrencyInputProps = {
  id?: string;
  value: number | null;
  onChange: (cents: number | null) => void;
  allowNegative?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

/**
 * Restricts typed input to a valid-looking currency string as the user
 * types (digits, a single decimal point, at most 2 fraction digits) so the
 * two-decimal rule from lib/currency.ts never needs to reject a keystroke —
 * it's simply unreachable.
 */
function sanitize(raw: string, allowNegative: boolean): string {
  const negative = allowNegative && raw.trim().startsWith("-");
  let digitsOnly = raw.replace(/[^0-9.]/g, "");
  const firstDot = digitsOnly.indexOf(".");
  if (firstDot !== -1) {
    digitsOnly =
      digitsOnly.slice(0, firstDot + 1) + digitsOnly.slice(firstDot + 1).replace(/\./g, "");
  }
  const [whole = "", frac] = digitsOnly.split(".");
  const result = frac !== undefined ? `${whole}.${frac.slice(0, 2)}` : whole;
  return negative ? `-${result}` : result;
}

/** A text input that behaves like a currency field: numeric keyboard, $ prefix, integer-cent output. */
export function CurrencyInput({
  id,
  value,
  onChange,
  allowNegative = false,
  placeholder = "0.00",
  className,
  autoFocus,
  ...aria
}: CurrencyInputProps) {
  const [text, setText] = React.useState(() =>
    value != null ? centsToDecimalString(value) : ""
  );
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(value != null ? centsToDecimalString(value) : "");
  }, [value, focused]);

  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        $
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        className="h-11 pl-7 text-base tabular-nums"
        value={text}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const sanitized = sanitize(event.target.value, allowNegative);
          setText(sanitized);
          const parsed = parseOptionalCurrencyToCents(sanitized, { allowNegative });
          onChange(parsed.ok ? parsed.cents : null);
        }}
        {...aria}
      />
    </div>
  );
}
