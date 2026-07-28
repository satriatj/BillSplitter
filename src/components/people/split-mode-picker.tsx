"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SplitMode } from "@/types/bill";

type SplitModePickerProps = {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
};

const OPTIONS: { value: SplitMode; title: string; description: string }[] = [
  { value: "equal", title: "Equal split", description: "Divide the total evenly" },
  { value: "itemized", title: "Itemized split", description: "Assign each item to who ordered it" },
];

export function SplitModePicker({ value, onChange }: SplitModePickerProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as SplitMode)}
      className="grid grid-cols-2 gap-2"
    >
      {OPTIONS.map((option) => (
        <Label
          key={option.value}
          htmlFor={`split-mode-${option.value}`}
          className="flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 rounded-xl border border-border bg-card px-3 py-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <RadioGroupItem id={`split-mode-${option.value}`} value={option.value} />
            {option.title}
          </span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}
