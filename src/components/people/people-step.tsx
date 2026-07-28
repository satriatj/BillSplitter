"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomBar } from "@/components/layout/bottom-bar";
import { findDuplicateNamePersonIds, isBlankName } from "@/lib/calculations/validation";
import type { BillDraftAction } from "@/lib/bill-reducer";
import type { BillDraft } from "@/types/bill";
import { PersonRow } from "./person-row";
import { PayerPicker } from "./payer-picker";
import { SplitModePicker } from "./split-mode-picker";

type PeopleStepProps = {
  draft: BillDraft;
  dispatch: (action: BillDraftAction) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PeopleStep({ draft, dispatch, onBack, onContinue }: PeopleStepProps) {
  const [newName, setNewName] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const duplicateIds = findDuplicateNamePersonIds(draft.people);
  const hasBlankName = draft.people.some((p) => isBlankName(p.name));
  const hasEnoughPeople = draft.people.length >= 2;
  const hasPayer = draft.payerId !== null && draft.people.some((p) => p.id === draft.payerId);
  const canContinue = hasEnoughPeople && !hasBlankName && duplicateIds.size === 0 && hasPayer;

  const handleAddPerson = () => {
    const trimmed = newName.trim();
    if (trimmed === "") return;
    dispatch({ type: "ADD_PERSON", name: trimmed });
    setNewName("");
  };

  const handleContinue = () => {
    setShowErrors(true);
    if (!canContinue) return;
    onContinue();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Who&apos;s splitting?</h1>
          <p className="text-sm text-muted-foreground">Add everyone sharing this bill.</p>
        </div>

        <div className="space-y-2">
          {draft.people.map((person, index) => (
            <PersonRow
              key={person.id}
              name={person.name}
              isYou={index === 0}
              isDuplicate={duplicateIds.has(person.id)}
              isBlank={showErrors && isBlankName(person.name)}
              canRemove={draft.people.length > 1}
              onRename={(name) => dispatch({ type: "RENAME_PERSON", id: person.id, name })}
              onRemove={() => dispatch({ type: "REMOVE_PERSON", id: person.id })}
            />
          ))}

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddPerson();
            }}
          >
            <Label htmlFor="new-person-name" className="sr-only">
              Add a person
            </Label>
            <Input
              id="new-person-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a person"
              className="h-11 flex-1 text-base"
            />
            <Button type="submit" size="icon" variant="secondary" className="h-11 w-11 shrink-0" aria-label="Add person">
              <UserPlus className="size-4" aria-hidden="true" />
            </Button>
          </form>

          {showErrors && !hasEnoughPeople && (
            <p className="text-xs text-destructive" role="alert">
              Add at least 2 people to split with.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Who paid?</h2>
          <PayerPicker
            people={draft.people}
            payerId={draft.payerId}
            onChange={(id) => dispatch({ type: "SET_PAYER", id })}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">How should this split?</h2>
          <SplitModePicker
            value={draft.splitMode}
            onChange={(mode) => dispatch({ type: "SET_SPLIT_MODE", mode })}
          />
        </div>
      </div>

      <BottomBar>
        <Button type="button" variant="outline" size="lg" className="h-12 flex-1 text-base" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" className="h-12 flex-[2] text-base" onClick={handleContinue}>
          Continue
        </Button>
      </BottomBar>
    </div>
  );
}
