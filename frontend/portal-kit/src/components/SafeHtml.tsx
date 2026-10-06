import React from "react";
import DOMPurify from "dompurify";

export interface SafeHtmlProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string;
  className?: string;
  as?: React.ElementType;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({
  html,
  className = "",
  as: Component = "div",
  ...props
}) => {
  const sanitizedHtml = DOMPurify.sanitize(html || "");

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...props}
    />
  );
};
