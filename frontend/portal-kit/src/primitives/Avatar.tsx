import React from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { clsx } from "clsx";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg"
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "",
  fallback = "?",
  size = "md",
  className
}) => {
  return (
    <RadixAvatar.Root
      className={clsx(
        "relative flex shrink-0 overflow-hidden rounded-full border border-[var(--ee-border)] select-none",
        sizeClasses[size],
        className
      )}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-[var(--ee-surface-inset)] font-semibold text-[var(--ee-muted)]"
      >
        {fallback.slice(0, 2).toUpperCase()}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
