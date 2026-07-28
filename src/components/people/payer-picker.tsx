"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Person } from "@/types/bill";

type PayerPickerProps = {
  people: Person[];
  payerId: string | null;
  onChange: (id: string) => void;
};

export function PayerPicker({ people, payerId, onChange }: PayerPickerProps) {
  return (
    <RadioGroup value={payerId ?? undefined} onValueChange={onChange} className="gap-2">
      {people.map((person) => (
        <Label
          key={person.id}
          htmlFor={`payer-${person.id}`}
          className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm font-medium has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
        >
          <RadioGroupItem id={`payer-${person.id}`} value={person.id} />
          <span className="flex-1 truncate">{person.name.trim() || "Unnamed"}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}
