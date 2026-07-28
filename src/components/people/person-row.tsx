"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PersonRowProps = {
  name: string;
  isDuplicate: boolean;
  isBlank: boolean;
  isYou: boolean;
  canRemove: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
};

export function PersonRow({
  name,
  isDuplicate,
  isBlank,
  isYou,
  canRemove,
  onRename,
  onRemove,
}: PersonRowProps) {
  const hasError = isDuplicate || isBlank;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-1">
      <div className="flex items-center gap-1">
        <Input
          value={name}
          onChange={(e) => onRename(e.target.value)}
          placeholder={isYou ? "Your name" : "Person's name"}
          aria-invalid={hasError}
          aria-label={isYou ? "Your name" : "Person's name"}
          className="h-11 border-none bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        />
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${name || "this person"}`}
            onClick={onRemove}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {isDuplicate && (
        <p className="flex items-center gap-1 pb-1.5 text-xs text-destructive" role="alert">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          Same name as another person
        </p>
      )}
      {isBlank && !isDuplicate && (
        <p className="flex items-center gap-1 pb-1.5 text-xs text-destructive" role="alert">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          Name can&apos;t be blank
        </p>
      )}
    </div>
  );
}
