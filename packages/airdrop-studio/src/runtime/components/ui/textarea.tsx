import * as React from "react";
import { cn } from "../../lib/utils.js";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "campaign-input campaign-ring flex min-h-[104px] w-full rounded-[var(--campaign-radius-md)] border px-3 py-2 text-sm text-[var(--campaign-foreground)] shadow-sm transition placeholder:text-[var(--campaign-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
