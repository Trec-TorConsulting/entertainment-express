import React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  interactive = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "rounded-[var(--ee-radius-lg)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] text-[var(--ee-text)] transition-all",
        elevated ? "shadow-ee-md" : "shadow-ee-sm",
        interactive && "hover:border-[var(--ee-border-strong)] hover:shadow-ee-md cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx("p-5 pb-3 flex flex-col space-y-1.5", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={clsx("font-semibold text-lg text-[var(--ee-text)] tracking-tight leading-none", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={clsx("text-sm text-[var(--ee-muted)]", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx("p-5 pt-0", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx("p-5 pt-0 flex items-center justify-between border-t border-[var(--ee-border-subtle)] mt-4", className)} {...props}>
    {children}
  </div>
);
