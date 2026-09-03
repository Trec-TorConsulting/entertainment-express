import React from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { clsx } from "clsx";

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  side = "bottom",
  align = "center",
  className
}) => {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          side={side}
          align={align}
          sideOffset={6}
          className={clsx(
            "z-[var(--ee-z-popover)] w-72 rounded-[var(--ee-radius-md)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] p-4 shadow-ee-lg text-[var(--ee-text)] outline-none",
            "animate-in fade-in-0 zoom-in-95",
            className
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};
