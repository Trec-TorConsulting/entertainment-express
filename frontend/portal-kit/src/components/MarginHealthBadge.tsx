import React from "react";
import { TrendingUp, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export interface MarginHealthBadgeProps {
  status?: "healthy" | "warning" | "critical" | string;
  marginPercent?: number;
  showPercent?: boolean;
  size?: "sm" | "md";
  className?: string;
  onClick?: () => void;
}

export const MarginHealthBadge: React.FC<MarginHealthBadgeProps> = ({
  status = "healthy",
  marginPercent,
  showPercent = true,
  size = "md",
  className = "",
  onClick,
}) => {
  const normStatus = (status || "healthy").toLowerCase();

  const config = {
    healthy: {
      label: "Healthy",
      bg: "rgba(16, 185, 129, 0.12)",
      text: "#10b981",
      border: "rgba(16, 185, 129, 0.25)",
      Icon: TrendingUp,
    },
    warning: {
      label: "Warning",
      bg: "rgba(245, 158, 11, 0.12)",
      text: "#f59e0b",
      border: "rgba(245, 158, 11, 0.25)",
      Icon: AlertTriangle,
    },
    critical: {
      label: "Critical",
      bg: "rgba(244, 63, 94, 0.12)",
      text: "#f43f5e",
      border: "rgba(244, 63, 94, 0.25)",
      Icon: AlertCircle,
    },
  }[normStatus] || {
    label: normStatus,
    bg: "rgba(100, 116, 139, 0.12)",
    text: "#64748b",
    border: "rgba(100, 116, 139, 0.25)",
    Icon: CheckCircle2,
  };

  const IconComp = config.Icon;
  const isSmall = size === "sm";

  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? "0.25rem" : "0.375rem",
        padding: isSmall ? "0.125rem 0.45rem" : "0.25rem 0.625rem",
        fontSize: isSmall ? "0.7rem" : "0.75rem",
        fontWeight: 600,
        borderRadius: "9999px",
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
      className={`ee-margin-badge ee-margin-${normStatus} ${className}`}
      title={marginPercent !== undefined ? `Margin: ${marginPercent.toFixed(1)}% (${config.label})` : config.label}
    >
      <IconComp size={isSmall ? 11 : 13} strokeWidth={2.5} />
      <span>
        {showPercent && marginPercent !== undefined
          ? `${marginPercent.toFixed(1)}%`
          : config.label}
      </span>
    </span>
  );
};
