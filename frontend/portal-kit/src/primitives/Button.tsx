import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { motion, HTMLMotionProps } from "framer-motion";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type Density = "cockpit" | "ops" | "consumer";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "type"> {
  variant?: ButtonVariant;
  density?: Density;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  type?: "submit" | "reset" | "button";
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

const densityStyles: Record<Density, string> = {
  cockpit: "min-h-[32px] px-2.5 py-1 text-xs gap-1.5 rounded-[var(--ee-radius-sm)]",
  ops: "min-h-[38px] px-3.5 py-1.5 text-sm gap-2 rounded-[var(--ee-radius-md)]",
  consumer: "min-h-[44px] px-5 py-2.5 text-base gap-2.5 rounded-[var(--ee-radius-lg)] font-medium"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      density = "ops",
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-colors select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantStyles[variant],
          densityStyles[density],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={density === "cockpit" ? "sm" : density === "ops" ? "md" : "md"} className="mr-1" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
