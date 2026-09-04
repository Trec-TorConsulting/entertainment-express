import React from "react";
import { clsx } from "clsx";
import { motion, HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  elevated?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  interactive = false,
  className,
  children,
  ...props
}) => {
  return (
    <motion.div
      whileHover={interactive ? { y: -4, scale: 1.01 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={clsx(
        "rounded-[var(--ee-radius-lg)] border border-[var(--ee-border)] text-[var(--ee-text)] transition-colors",
        elevated ? "glass-panel shadow-ee-md" : "bg-[var(--ee-surface-raised)] shadow-ee-sm",
        interactive && "hover:border-[var(--ee-border-strong)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
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
