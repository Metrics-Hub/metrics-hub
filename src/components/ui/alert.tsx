import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl p-4 transition-all duration-300 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: 
          "bg-background/80 backdrop-blur-md border border-border/30 text-foreground shadow-lg [&>svg]:text-foreground",
        glass:
          "bg-background/60 backdrop-blur-xl border border-border/20 text-foreground shadow-xl [&>svg]:text-primary",
        info:
          "bg-primary/10 backdrop-blur-md border border-primary/20 text-foreground shadow-lg [&>svg]:text-primary",
        success:
          "bg-success/10 backdrop-blur-md border border-success/20 text-foreground shadow-lg [&>svg]:text-success",
        warning:
          "bg-warning/10 backdrop-blur-md border border-warning/30 text-foreground shadow-lg [&>svg]:text-warning",
        destructive: 
          "bg-destructive/10 backdrop-blur-md border border-destructive/20 text-foreground shadow-lg [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, dismissible, onDismiss, children, ...props }, ref) => (
    <div 
      ref={ref} 
      role="alert" 
      className={cn(alertVariants({ variant }), className)} 
      {...props}
    >
      {children}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-foreground/10 transition-all"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
