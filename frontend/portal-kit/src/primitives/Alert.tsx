import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; iconColor: string; defaultIcon: React.ReactNode }> = {
  info: {
    container: "bg-[var(--ee-info-soft)] border-[var(--ee-info-border)] text-[var(--ee-info-text)]",
    iconColor: "text-[var(--ee-info)]",
    defaultIcon: <Info className="h-5 w-5" />
  },
  success: {
    container: "bg-[var(--ee-success-soft)] border-[var(--ee-success-border)] text-[var(--ee-success-text)]",
    iconColor: "text-[var(--ee-success)]",
    defaultIcon: <CheckCircle2 className="h-5 w-5" />
  },
  warning: {
    container: "bg-[var(--ee-warning-soft)] border-[var(--ee-warning-border)] text-[var(--ee-warning-text)]",
    iconColor: "text-[var(--ee-warning)]",
    defaultIcon: <AlertTriangle className="h-5 w-5" />
  },
  danger: {
    container: "bg-[var(--ee-danger-soft)] border-[var(--ee-danger-border)] text-[var(--ee-danger-text)]",
    iconColor: "text-[var(--ee-danger)]",
    defaultIcon: <AlertCircle className="h-5 w-5" />
  }
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  icon,
  onClose,
  className,
  children,
  ...props
}) => {
  const config = variantStyles[variant];

  return (
    <div
      role="alert"
      className={clsx(
        "relative w-full rounded-[var(--ee-radius-lg)] border p-4 flex gap-3 text-sm transition-all",
        config.container,
        className
      )}
      {...props}
    >
      <div className={clsx("shrink-0", config.iconColor)}>
        {icon || config.defaultIcon}
      </div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        {children && <div className="text-sm opacity-90 leading-relaxed">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
