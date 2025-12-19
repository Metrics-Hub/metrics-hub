import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cardAnimation } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay?: number;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  /** Optional element to render on the right side of the header (e.g., badges, buttons) */
  headerAction?: React.ReactNode;
  /** Custom header content - replaces the default CardTitle */
  customHeader?: React.ReactNode;
  /** Optional click handler for the entire card */
  onClick?: () => void;
  /** Height for loading skeleton, defaults to 200 */
  skeletonHeight?: number;
  /** Custom loading skeleton component */
  loadingSkeleton?: React.ReactNode;
}

const ChartCardSkeleton = ({ height = 200 }: { height?: number }) => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className={`w-full`} style={{ height }} />
  </div>
);

const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  (
    {
      title,
      icon: Icon,
      children,
      delay = 0,
      loading = false,
      className,
      contentClassName,
      headerClassName,
      headerAction,
      customHeader,
      onClick,
      skeletonHeight = 200,
      loadingSkeleton,
    },
    ref
  ) => {
    const animation = cardAnimation(delay); // delay em ms (consistente com o resto do app)
    
    return (
      <motion.div
        ref={ref}
        {...animation}
        className={cn(onClick && "cursor-pointer", "h-full")}
        onClick={onClick}
      >
        <Card
          variant="glass"
          className={cn(
            "h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5",
            className
          )}
        >
          <CardHeader className={cn("pb-2", headerClassName)}>
            {customHeader ? (
              customHeader
            ) : (
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
                {headerAction && (
                  <div className="ml-auto flex items-center gap-2">
                    {headerAction}
                  </div>
                )}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className={cn("pt-0 p-3 md:p-6", contentClassName)}>
            {loading ? (
              loadingSkeleton || <ChartCardSkeleton height={skeletonHeight} />
            ) : (
              children
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

ChartCard.displayName = "ChartCard";

export { ChartCard, ChartCardSkeleton };
export type { ChartCardProps };
