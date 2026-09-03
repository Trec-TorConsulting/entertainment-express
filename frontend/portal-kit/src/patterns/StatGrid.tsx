import React from "react";
import { clsx } from "clsx";

export interface StatGridProps {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export const StatGrid: React.FC<StatGridProps> = ({
  columns = 4,
  children,
  className
}) => {
  return (
    <div className={clsx("grid gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
};
