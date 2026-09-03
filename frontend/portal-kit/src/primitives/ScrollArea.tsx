import React from "react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import { clsx } from "clsx";

export interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  maxHeight
}) => {
  return (
    <RadixScrollArea.Root
      className={clsx("relative overflow-hidden", className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none transition-colors p-0.5 bg-transparent hover:bg-[var(--ee-surface-inset)] w-2.5"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--ee-border-strong)]" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
};
