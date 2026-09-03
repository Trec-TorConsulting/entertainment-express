import React from "react";
import { clsx } from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: number | string;
  width?: number | string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = "1.25rem",
  width,
  circle = false,
  className,
  style,
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse bg-[var(--ee-surface-inset)] border border-[var(--ee-border-subtle)]",
        circle ? "rounded-full" : "rounded-[var(--ee-radius-md)]",
        className
      )}
      style={{
        height,
        width,
        ...style
      }}
      {...props}
    />
  );
};
