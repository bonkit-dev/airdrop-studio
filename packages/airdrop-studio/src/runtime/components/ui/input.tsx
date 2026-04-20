import * as React from "react";
import { cn } from "../../lib/utils.js";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "campaign-input campaign-ring flex h-11 w-full rounded-[var(--campaign-radius-md)] border px-3 py-2 text-sm text-[var(--campaign-foreground)] shadow-sm transition placeholder:text-[var(--campaign-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
