import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName
}) => {
  const initialValue = defaultValue || (tabs.length > 0 ? tabs[0].id : undefined);

  return (
    <RadixTabs.Root
      defaultValue={initialValue}
      value={value}
      onValueChange={onValueChange}
      className={clsx("w-full flex flex-col", className)}
    >
      <RadixTabs.List
        className={clsx(
          "inline-flex h-10 items-center justify-start border-b border-[var(--ee-border)] gap-6 bg-transparent text-[var(--ee-muted)]",
          listClassName
        )}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={clsx(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap py-2 text-sm font-medium transition-all select-none border-b-2 border-transparent -mb-[1px]",
              "hover:text-[var(--ee-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ee-brand)]",
              "data-[state=active]:border-[var(--ee-brand)] data-[state=active]:text-[var(--ee-brand)] data-[state=active]:font-semibold",
              "disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            )}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1">{tab.badge}</span>}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.id}
          value={tab.id}
          className="mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ee-brand)]"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};
