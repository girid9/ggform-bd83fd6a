import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, value, defaultValue, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const hasValue = value !== undefined ? String(value).length > 0 : false;
    const isActive = focused || hasValue;
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          value={value}
          className={cn(
            "peer flex h-13 w-full rounded-2xl border border-border bg-background px-4 pt-5 pb-2 text-sm ring-offset-background transition-all duration-200 placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          placeholder={label}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none origin-left",
            isActive
              ? "top-2 text-[10px] font-medium text-primary"
              : "top-4 text-sm text-muted-foreground/50"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
