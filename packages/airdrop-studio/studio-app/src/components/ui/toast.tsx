import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertTriangle, Loader2, X, CircleAlert } from "lucide-react"
import { cn } from "../../lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed right-0 top-0 z-[120] flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[420px]",
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "toast-animate group pointer-events-auto relative flex w-full items-start gap-3 border bg-card p-4 pr-9 shadow-2xl backdrop-blur data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
  {
    variants: {
      variant: {
        default: "border-border text-foreground",
        success: "border-primary/40 bg-primary/10 text-foreground",
        warning: "border-amber-500/40 bg-amber-500/10 text-foreground",
        destructive: "border-destructive/40 bg-destructive/10 text-foreground",
        loading: "border-border bg-card text-foreground",
        processing: "border-sky-500/40 bg-sky-500/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const iconByVariant = {
  default: CircleAlert,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: CircleAlert,
  loading: Loader2,
  processing: Loader2,
} as const

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant = "default", children, ...props }, ref) => {
  const resolvedVariant = variant ?? "default"
  const Icon = iconByVariant[resolvedVariant]
  return (
    <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant: resolvedVariant }), className)} {...props}>
      <div
        className={cn(
          "mt-0.5 shrink-0",
          (resolvedVariant === "loading" || resolvedVariant === "processing") && "animate-spin",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-sm p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground",
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

export { ToastProvider, ToastViewport, Toast, ToastClose, ToastTitle, ToastDescription, type ToastProps }
