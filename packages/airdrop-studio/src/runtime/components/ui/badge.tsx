import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/6 text-[var(--campaign-secondary)]",
        secondary: "border-[var(--campaign-primary)]/20 bg-[var(--campaign-primary)]/12 text-[var(--campaign-primary)]",
        outline: "border-white/10 text-[var(--campaign-foreground)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
