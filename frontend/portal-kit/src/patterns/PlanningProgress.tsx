import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { DonutProgress } from "./DonutProgress";
import { Card, CardHeader, CardTitle, CardContent } from "../primitives/Card";
import { Button } from "../primitives/Button";

export interface PlanningSection {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required?: boolean;
}

export interface PlanningProgressProps {
  title?: string;
  subtitle?: string;
  sections: PlanningSection[];
  onOpenSection?: (id: string) => void;
  className?: string;
}

export const PlanningProgress: React.FC<PlanningProgressProps> = ({
  title = "Planning & Event Details",
  subtitle = "Complete these sections so your talent and operations crew can execute flawlessly.",
  sections,
  onOpenSection,
  className
}) => {
  const completedCount = sections.filter((s) => s.completed).length;
  const totalCount = sections.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <Card elevated className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-[var(--ee-muted)] mt-1">{subtitle}</p>
        </div>
        <DonutProgress
          percentage={percentage}
          variant={isAllDone ? "success" : "brand"}
          size={56}
          strokeWidth={5}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => onOpenSection?.(section.id)}
            className={clsx(
              "flex items-center justify-between p-3 rounded-[var(--ee-radius-md)] border transition-all",
              section.completed
                ? "bg-[var(--ee-surface-base)] border-[var(--ee-border)] text-[var(--ee-text)]"
                : "bg-[var(--ee-surface-raised)] border-[var(--ee-border)] text-[var(--ee-text)] hover:border-[var(--ee-border-strong)]",
              onOpenSection && "cursor-pointer"
            )}
          >
            <div className="flex items-center gap-3">
              {section.completed ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--ee-success)] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--ee-muted)] shrink-0" />
              )}
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>{section.title}</span>
                  {section.required && !section.completed && (
                    <span className="text-[10px] font-semibold text-[var(--ee-warning-text)] bg-[var(--ee-warning-soft)] px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  )}
                </div>
                {section.description && (
                  <div className="text-xs text-[var(--ee-muted)]">{section.description}</div>
                )}
              </div>
            </div>
            {onOpenSection && (
              <Button variant="ghost" density="cockpit" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                {section.completed ? "Review" : "Fill Out"}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
