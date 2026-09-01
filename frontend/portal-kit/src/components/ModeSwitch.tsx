import React from "react";

export type ModeOption = { id: string; label: string };

type Props = {
  value: string;
  options: ModeOption[];
  onChange: (id: string) => void;
};

export function ModeSwitch({ value, options, onChange }: Props) {
  if (options.length < 2) return null;
  return (
    <div className="ee-mode-switch" role="tablist" aria-label="Workspace">
      {options.map((option) => (
        <button key={option.id} type="button" role="tab" aria-pressed={value === option.id} onClick={() => onChange(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
