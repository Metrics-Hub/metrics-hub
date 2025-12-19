import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "shimmer";
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "shimmer", ...props }, ref) => {
    const variants = {
      default: "animate-pulse bg-muted",
      glass: "skeleton-glass",
      shimmer: "skeleton-shimmer",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-lg", variants[variant], className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Compound components for common skeleton patterns
function SkeletonText({ className, lines = 3, ...props }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "glass-card p-5 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTable({ className, rows = 5, ...props }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24 ml-auto" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-3 rounded-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="h-5 w-48" style={{ animationDelay: `${i * 50}ms` }} />
          <Skeleton className="h-5 w-20" style={{ animationDelay: `${i * 50 + 25}ms` }} />
          <Skeleton className="h-5 w-24 ml-auto" style={{ animationDelay: `${i * 50 + 50}ms` }} />
          <Skeleton className="h-5 w-24" style={{ animationDelay: `${i * 50 + 75}ms` }} />
          <Skeleton className="h-5 w-24" style={{ animationDelay: `${i * 50 + 100}ms` }} />
        </div>
      ))}
    </div>
  );
}

const SkeletonChart = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("glass-card p-5", className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }
);

SkeletonChart.displayName = "SkeletonChart";

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonChart };
