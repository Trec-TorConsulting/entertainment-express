import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { Density } from "./Button";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  density?: Density;
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const densityClasses: Record<Density, string> = {
  cockpit: "h-8 px-2.5 text-xs rounded-[var(--ee-radius-sm)]",
  ops: "h-9 px-3 text-sm rounded-[var(--ee-radius-md)]",
  consumer: "h-11 px-3.5 text-base rounded-[var(--ee-radius-lg)]"
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      density = "ops",
      error,
      disabled,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[var(--ee-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError ? "true" : undefined}
          className={clsx(
            "w-full bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border transition-colors",
            "placeholder:text-[var(--ee-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "disabled:opacity-50 disabled:bg-[var(--ee-surface-inset)] disabled:cursor-not-allowed",
            hasError
              ? "border-[var(--ee-danger)] focus-visible:border-[var(--ee-danger)] focus-visible:ring-[var(--ee-danger)]"
              : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] focus-visible:border-[var(--ee-brand)] focus-visible:ring-[var(--ee-brand)]",
            leftIcon ? "pl-9" : "",
            rightIcon ? "pr-9" : "",
            densityClasses[density],
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-[var(--ee-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
