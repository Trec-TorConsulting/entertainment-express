import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { ButtonVariant, Density } from "./Button";
import { Spinner } from "./Spinner";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  icon: React.ReactNode;
  variant?: ButtonVariant;
  density?: Density;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ee-brand)] text-white hover:bg-[var(--ee-brand-hover)] active:bg-[var(--ee-brand-active)] border border-transparent shadow-sm focus-visible:ring-[var(--ee-brand)]",
  secondary:
    "bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border border-[var(--ee-border-strong)] hover:bg-[var(--ee-surface-inset)] active:bg-[var(--ee-border)] shadow-sm focus-visible:ring-[var(--ee-brand)]",
  outline:
    "bg-transparent text-[var(--ee-brand)] border border-[var(--ee-brand)] hover:bg-[var(--ee-brand-soft)] active:bg-[var(--ee-brand-soft)] focus-visible:ring-[var(--ee-brand)]",
  ghost:
    "bg-transparent text-[var(--ee-text)] border border-transparent hover:bg-[var(--ee-surface-inset)] active:bg-[var(--ee-border)] focus-visible:ring-[var(--ee-brand)]",
  destructive:
    "bg-[var(--ee-danger)] text-white hover:opacity-90 active:opacity-95 border border-transparent shadow-sm focus-visible:ring-[var(--ee-danger)]"
};

const densitySizes: Record<Density, string> = {
  cockpit: "w-8 h-8 rounded-[var(--ee-radius-sm)]",
  ops: "w-9 h-9 rounded-[var(--ee-radius-md)]",
  consumer: "w-11 h-11 rounded-[var(--ee-radius-lg)]"
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "ghost",
      density = "ops",
      loading = false,
      disabled = false,
      className,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={clsx(
          "inline-flex items-center justify-center transition-colors select-none shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantStyles[variant],
          densitySizes[density],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={density === "cockpit" ? "sm" : "md"} />
        ) : (
          <span className="inline-flex items-center justify-center">{icon}</span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
