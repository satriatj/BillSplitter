"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
}

export function CopySummaryButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const succeeded = await copyToClipboard(text);
    if (succeeded) {
      setCopied(true);
      toast.success("Summary copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Couldn't copy — try selecting the text manually");
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="h-12 w-full text-base"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {copied ? "Copied!" : "Copy summary"}
    </Button>
  );
}
