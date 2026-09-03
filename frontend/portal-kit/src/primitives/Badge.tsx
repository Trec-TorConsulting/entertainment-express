import React from "react";
import { clsx } from "clsx";

export type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--ee-surface-inset)] text-[var(--ee-text)] border border-[var(--ee-border)]",
  brand:
    "bg-[var(--ee-brand-soft)] text-[var(--ee-brand-text)] border border-[var(--ee-brand-border)]",
  success:
    "bg-[var(--ee-success-soft)] text-[var(--ee-success-text)] border border-[var(--ee-success-border)]",
  warning:
    "bg-[var(--ee-warning-soft)] text-[var(--ee-warning-text)] border border-[var(--ee-warning-border)]",
  danger:
    "bg-[var(--ee-danger-soft)] text-[var(--ee-danger-text)] border border-[var(--ee-danger-border)]",
  info:
    "bg-[var(--ee-info-soft)] text-[var(--ee-info-text)] border border-[var(--ee-info-border)]",
  outline:
    "bg-transparent text-[var(--ee-text)] border border-[var(--ee-border-strong)]"
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--ee-muted)]",
  brand: "bg-[var(--ee-brand)]",
  success: "bg-[var(--ee-success)]",
  warning: "bg-[var(--ee-warning)]",
  danger: "bg-[var(--ee-danger)]",
  info: "bg-[var(--ee-info)]",
  outline: "bg-[var(--ee-text)]"
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
  lg: "px-3 py-1 text-sm gap-2 font-medium"
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium select-none transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant]
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
