import type { ReactNode } from "react";

/** Sticky footer for the main action, kept clear of the home indicator via safe-area padding. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="safe-bottom sticky bottom-0 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
