import React from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { clsx } from "clsx";

export interface DropdownMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "center" | "end";
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = "end",
  className
}) => {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>
        {trigger}
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={6}
          className={clsx(
            "z-[var(--ee-z-dropdown)] min-w-[10rem] overflow-hidden rounded-[var(--ee-radius-md)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] p-1.5 shadow-ee-lg text-[var(--ee-text)]",
            "animate-in fade-in-80 zoom-in-95",
            className
          )}
        >
          {items.map((item) => (
            <React.Fragment key={item.key}>
              {item.separatorBefore && (
                <RadixDropdownMenu.Separator className="my-1 h-px bg-[var(--ee-border-subtle)]" />
              )}
              <RadixDropdownMenu.Item
                disabled={item.disabled}
                onClick={item.onClick}
                className={clsx(
                  "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--ee-radius-sm)] px-2.5 py-1.5 text-sm outline-none transition-colors",
                  item.destructive
                    ? "text-[var(--ee-danger)] focus:bg-[var(--ee-danger-soft)] focus:text-[var(--ee-danger-text)]"
                    : "text-[var(--ee-text)] focus:bg-[var(--ee-surface-inset)] focus:text-[var(--ee-brand)]",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                {item.icon && <span className="w-4 h-4 shrink-0 opacity-80">{item.icon}</span>}
                <span>{item.label}</span>
              </RadixDropdownMenu.Item>
            </React.Fragment>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
};
