"use client";

import { useRef, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImageForUpload } from "@/lib/compress-image";
import type { ScannedReceipt } from "@/lib/receipt-scan";
import type { BillDraftAction } from "@/lib/bill-reducer";

type ScanReceiptButtonProps = {
  hasName: boolean;
  dispatch: (action: BillDraftAction) => void;
};

export function ScanReceiptButton({ hasName, dispatch }: ScanReceiptButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const applyScannedReceipt = (scanned: ScannedReceipt) => {
    if (scanned.restaurantName && !hasName) {
      dispatch({ type: "SET_NAME", name: scanned.restaurantName });
    }

    for (const item of scanned.items) {
      dispatch({ type: "ADD_ITEM", item });
    }

    if (scanned.subtotalCents !== null) {
      dispatch({ type: "SET_ENTERED_SUBTOTAL_CENTS", cents: scanned.subtotalCents });
    }
    if (scanned.taxCents > 0) {
      dispatch({ type: "SET_ADJUSTMENT_CENTS", key: "taxCents", cents: scanned.taxCents });
    }
    if (scanned.tipCents > 0) {
      dispatch({ type: "SET_ADJUSTMENT_CENTS", key: "tipCents", cents: scanned.tipCents });
    }
    if (scanned.totalCents !== null) {
      dispatch({ type: "SET_ENTERED_TOTAL_CENTS", cents: scanned.totalCents });
    }

    const itemWord = scanned.items.length === 1 ? "item" : "items";
    if (scanned.hasUncertainAmounts) {
      toast.warning(`Added ${scanned.items.length} ${itemWord} — double-check prices against the receipt, some weren't clear.`);
    } else {
      toast.success(`Added ${scanned.items.length} ${itemWord} from the receipt.`);
    }
  };

  const handleFile = async (file: File) => {
    setIsScanning(true);
    try {
      const { base64, mimeType } = await compressImageForUpload(file);
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        toast.error(payload?.error ?? "Couldn't scan that receipt.");
        return;
      }
      applyScannedReceipt(payload.data as ScannedReceipt);
    } catch {
      toast.error("Couldn't scan that receipt — try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full text-base"
        disabled={isScanning}
        onClick={() => inputRef.current?.click()}
      >
        {isScanning ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ScanLine className="size-4" aria-hidden="true" />
        )}
        {isScanning ? "Scanning receipt…" : "Scan receipt"}
      </Button>
    </>
  );
}
