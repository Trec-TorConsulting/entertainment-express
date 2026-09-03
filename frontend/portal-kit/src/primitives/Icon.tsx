import React from "react";
import * as LucideIcons from "lucide-react";
import { clsx } from "clsx";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: keyof typeof LucideIcons | string;
  size?: IconSize;
  strokeWidth?: number;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  strokeWidth = 1.75,
  className,
  ...props
}) => {
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    // Fallback if icon name doesn't match
    return <LucideIcons.HelpCircle size={sizeMap[size]} strokeWidth={strokeWidth} className={className} {...props} />;
  }

  return <IconComponent size={sizeMap[size]} strokeWidth={strokeWidth} className={clsx("shrink-0", className)} {...props} />;
};
