import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { Density } from "./Button";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  density?: Density;
  error?: string | boolean;
}

const densityClasses: Record<Density, string> = {
  cockpit: "p-2 text-xs rounded-[var(--ee-radius-sm)]",
  ops: "p-2.5 text-sm rounded-[var(--ee-radius-md)]",
  consumer: "p-3.5 text-base rounded-[var(--ee-radius-lg)]"
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      density = "ops",
      error,
      disabled,
      className,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError ? "true" : undefined}
        className={clsx(
          "w-full bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border transition-colors resize-y",
          "placeholder:text-[var(--ee-muted)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:bg-[var(--ee-surface-inset)] disabled:cursor-not-allowed",
          hasError
            ? "border-[var(--ee-danger)] focus-visible:border-[var(--ee-danger)] focus-visible:ring-[var(--ee-danger)]"
            : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] focus-visible:border-[var(--ee-brand)] focus-visible:ring-[var(--ee-brand)]",
          densityClasses[density],
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
