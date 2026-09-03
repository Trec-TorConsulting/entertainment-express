import React from "react";
import * as RadixSeparator from "@radix-ui/react-separator";
import { clsx } from "clsx";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  decorative = true,
  className
}) => {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={clsx(
        "shrink-0 bg-[var(--ee-border)]",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
    />
  );
};
