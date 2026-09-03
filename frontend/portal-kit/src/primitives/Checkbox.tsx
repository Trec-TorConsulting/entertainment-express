import React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { Density } from "./Button";

export interface CheckboxProps {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  label?: React.ReactNode;
  density?: Density;
  className?: string;
}

const boxSizes: Record<Density, string> = {
  cockpit: "h-3.5 w-3.5 rounded-[3px]",
  ops: "h-4 w-4 rounded-[4px]",
  consumer: "h-5 w-5 rounded-[5px]"
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  id,
  name,
  label,
  density = "ops",
  className,
}) => {
  return (
    <label
      htmlFor={id}
      className={clsx(
        "inline-flex items-center gap-2 select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <RadixCheckbox.Root
        id={id}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={clsx(
          "peer flex items-center justify-center border border-[var(--ee-border-strong)] bg-[var(--ee-surface-raised)] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ee-brand)] focus-visible:ring-offset-1",
          "data-[state=checked]:bg-[var(--ee-brand)] data-[state=checked]:border-[var(--ee-brand)] data-[state=checked]:text-white",
          "disabled:cursor-not-allowed disabled:bg-[var(--ee-surface-inset)]",
          boxSizes[density]
        )}
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
          <Check className={density === "consumer" ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && <span className="text-sm font-medium text-[var(--ee-text)]">{label}</span>}
    </label>
  );
};
