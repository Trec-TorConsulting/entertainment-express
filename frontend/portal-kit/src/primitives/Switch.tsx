import React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { clsx } from "clsx";
import { Density } from "./Button";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  label?: React.ReactNode;
  density?: Density;
  className?: string;
}

const trackSizes: Record<Density, string> = {
  cockpit: "h-4 w-7",
  ops: "h-5 w-9",
  consumer: "h-6 w-11"
};

const thumbSizes: Record<Density, string> = {
  cockpit: "h-3 w-3 data-[state=checked]:translate-x-3",
  ops: "h-4 w-4 data-[state=checked]:translate-x-4",
  consumer: "h-5 w-5 data-[state=checked]:translate-x-5"
};

export const Switch: React.FC<SwitchProps> = ({
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
        "inline-flex items-center gap-2.5 select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <RadixSwitch.Root
        id={id}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={clsx(
          "peer inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ee-brand)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          "data-[state=checked]:bg-[var(--ee-brand)] data-[state=unchecked]:bg-[var(--ee-border-strong)]",
          trackSizes[density]
        )}
      >
        <RadixSwitch.Thumb
          className={clsx(
            "pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform",
            "translate-x-0.5",
            thumbSizes[density]
          )}
        />
      </RadixSwitch.Root>
      {label && <span className="text-sm font-medium text-[var(--ee-text)]">{label}</span>}
    </label>
  );
};
