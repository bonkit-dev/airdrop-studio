import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Label } from "./label"
import { Separator } from "./separator"

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("flex w-full flex-col gap-5", className)} {...props} />
}

const fieldVariants = cva("group/field flex w-full gap-3", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
      responsive: "flex-col md:flex-row md:items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" className={cn(fieldVariants({ orientation }), className)} {...props} />
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn("flex w-fit gap-2 leading-snug", className)} {...props} />
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-separator" className={cn("relative -my-2 h-5 text-sm", className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children ? (
        <span className="bg-background text-muted-foreground relative mx-auto block w-fit px-2">{children}</span>
      ) : null}
    </div>
  )
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator }
