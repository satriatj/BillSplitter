import { cn } from "@/lib/utils";
import { WIZARD_STEPS, type WizardStep } from "@/types/bill";

const STEP_LABELS: Record<WizardStep, string> = {
  bill: "Bill",
  people: "People",
  assign: "Assign",
  summary: "Summary",
};

export function StepProgress({ step }: { step: WizardStep }) {
  const currentIndex = WIZARD_STEPS.indexOf(step);

  return (
    <div
      className="safe-top px-4 pt-3 pb-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={WIZARD_STEPS.length}
      aria-valuenow={currentIndex + 1}
      aria-valuetext={`Step ${currentIndex + 1} of ${WIZARD_STEPS.length}: ${STEP_LABELS[step]}`}
    >
      <div className="flex items-center gap-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        Step {currentIndex + 1} of {WIZARD_STEPS.length} · {STEP_LABELS[step]}
      </p>
    </div>
  );
}
