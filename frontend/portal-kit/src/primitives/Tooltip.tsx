import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { clsx } from "clsx";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200
}) => {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={4}
            className={clsx(
              "z-[var(--ee-z-tooltip)] overflow-hidden rounded-[var(--ee-radius-sm)] bg-[var(--ee-rail)] px-2.5 py-1 text-xs text-[var(--ee-rail-text)] shadow-md select-none",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-[var(--ee-rail)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};
