import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Density } from "./Button";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  density?: Density;
  disabled?: boolean;
  error?: string | boolean;
  className?: string;
  id?: string;
}

const densityTriggerClasses: Record<Density, string> = {
  cockpit: "h-8 px-2.5 text-xs rounded-[var(--ee-radius-sm)]",
  ops: "h-9 px-3 text-sm rounded-[var(--ee-radius-md)]",
  consumer: "h-11 px-3.5 text-base rounded-[var(--ee-radius-lg)]"
};

export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option...",
  options,
  density = "ops",
  disabled = false,
  error = false,
  className,
  id
}) => {
  const hasError = Boolean(error);

  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        className={clsx(
          "w-full inline-flex items-center justify-between bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:bg-[var(--ee-surface-inset)] disabled:cursor-not-allowed cursor-pointer",
          hasError
            ? "border-[var(--ee-danger)] focus-visible:border-[var(--ee-danger)] focus-visible:ring-[var(--ee-danger)]"
            : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] focus-visible:border-[var(--ee-brand)] focus-visible:ring-[var(--ee-brand)]",
          densityTriggerClasses[density],
          className
        )}
      >
        <RadixSelect.Value placeholder={<span className="text-[var(--ee-muted)]">{placeholder}</span>} />
        <RadixSelect.Icon className="text-[var(--ee-muted)] ml-2 shrink-0">
          <ChevronDown className="w-4 h-4 opacity-70" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={clsx(
            "z-[var(--ee-z-dropdown)] min-w-[8rem] overflow-hidden bg-[var(--ee-surface-raised)] text-[var(--ee-text)] rounded-[var(--ee-radius-md)] border border-[var(--ee-border)] shadow-ee-lg",
            "animate-in fade-in-80"
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={clsx(
                  "relative flex w-full select-none items-center rounded-[var(--ee-radius-sm)] py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                  "data-[highlighted]:bg-[var(--ee-surface-inset)] data-[highlighted]:text-[var(--ee-brand)] cursor-pointer",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4 text-[var(--ee-brand)]" />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};
