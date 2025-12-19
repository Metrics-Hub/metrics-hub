import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-md hover:shadow-primary/20",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:shadow-md hover:shadow-destructive/20",
        outline: "text-foreground hover:bg-muted/50",
        success: "border-transparent bg-success/15 text-success hover:bg-success/25",
        warning: "border-transparent bg-warning/15 text-warning hover:bg-warning/25",
        glass: "border-border/30 bg-background/30 backdrop-blur-sm text-foreground hover:bg-background/50 hover:border-border/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(badgeVariants({ variant }), className)} 
        {...props} 
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
