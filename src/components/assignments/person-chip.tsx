"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PersonChipProps = {
  name: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
};

/** A large multi-select chip. Selection is shown with a check icon and border/fill change, never color alone. */
export function PersonChip({ name, selected, onToggle, className }: PersonChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex h-12 min-w-20 items-center justify-center gap-1.5 rounded-full border-2 px-4 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
        className
      )}
    >
      {selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{name.trim() || "Unnamed"}</span>
    </button>
  );
}
