import type { ReactNode } from "react";

/** Centers content in a phone-width column on desktop; fills the viewport on mobile. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:my-0 sm:border-x sm:border-border">
      {children}
    </div>
  );
}
