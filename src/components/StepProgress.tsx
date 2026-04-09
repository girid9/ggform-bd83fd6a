import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const StepProgress = ({ currentStep, totalSteps, labels }: StepProgressProps) => {
  return (
    <div className="w-full mb-6">
      <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
        Step {currentStep} of {totalSteps}
      </p>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-primary"
                    : isCurrent
                    ? "bg-primary/60"
                    : "bg-muted"
                )}
              />
              {labels && labels[i] && (
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    isCompleted || isCurrent
                      ? "text-primary font-medium"
                      : "text-muted-foreground/50"
                  )}
                >
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { StepProgress };
