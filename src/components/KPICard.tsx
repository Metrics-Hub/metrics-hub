import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Info, Maximize2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { SparklineDialog } from "@/components/SparklineDialog";

export type ProgressStatus = "danger" | "warning" | "success" | "neutral";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  sparklineData?: number[];
  className?: string;
  loading?: boolean;
  tooltip?: string;
  delay?: number;
  progress?: {
    current: number;
    target: number;
  };
  progressStatus?: {
    status: ProgressStatus;
    label: string;
    expectedPercent: number;
  };
  formatSparklineValue?: (value: number) => string;
}

const cardAnimation = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  viewport: { once: true, margin: "-30px" },
  transition: {
    duration: 0.4,
    delay: delay / 1000,
    ease: "easeOut" as const,
  },
});

const statusBorderColors: Record<ProgressStatus, string> = {
  danger: "border-l-destructive",
  warning: "border-l-warning",
  success: "border-l-success",
  neutral: "border-l-transparent",
};

const statusBgColors: Record<ProgressStatus, string> = {
  danger: "bg-destructive/5",
  warning: "bg-warning/5",
  success: "bg-success/5",
  neutral: "",
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  sparklineData,
  className,
  loading = false,
  tooltip,
  delay = 0,
  progress,
  progressStatus,
  formatSparklineValue,
}: KPICardProps) {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const chartData = sparklineData?.map((value, index) => ({ value, index })) || [];

  if (loading) {
    return (
      <motion.div {...cardAnimation(delay)} className="cursor-pointer h-full">
        <Card variant="glass" className={cn("kpi-card h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5", className)}>
          <CardContent className={cn("p-5", isMobile && "p-3")}>
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton variant="glass" className={cn("h-4 w-28", isMobile && "h-3 w-20")} />
                <Skeleton variant="glass" className={cn("h-8 w-36", isMobile && "h-6 w-24")} style={{ animationDelay: "50ms" }} />
                <Skeleton variant="glass" className={cn("h-6 w-20 rounded-full", isMobile && "h-5 w-16")} style={{ animationDelay: "100ms" }} />
              </div>
              {!isMobile && (
                <Skeleton variant="glass" className="h-10 w-24 rounded-lg" style={{ animationDelay: "150ms" }} />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const statusBorder = progressStatus ? statusBorderColors[progressStatus.status] : "";
  const statusBg = progressStatus ? statusBgColors[progressStatus.status] : "";

  return (
    <motion.div {...cardAnimation(delay)} className="cursor-pointer h-full">
      <Card 
        variant="glass" 
        className={cn(
          "kpi-card h-full group overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
          progressStatus && "border-l-4",
          statusBorder,
          statusBg,
          className
        )}
      >
        <CardContent className={cn("p-5", isMobile && "p-3")}>
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className={cn("space-y-2 flex-1 min-w-0", isMobile && "space-y-1")}>
              <div className={cn(
                "text-sm font-medium text-muted-foreground flex items-center gap-2 transition-colors group-hover:text-foreground/80",
                isMobile && "text-xs gap-1"
              )}>
                {icon && (
                  <span className={cn(
                    "text-primary/80 group-hover:text-primary transition-colors flex-shrink-0",
                    isMobile && "[&>svg]:h-3 [&>svg]:w-3"
                  )}>
                    {icon}
                  </span>
                )}
                <span className="truncate">{title}</span>
                {tooltip && !isMobile && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <span>{tooltip}</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className={cn(
                "text-2xl font-bold text-foreground tracking-tight",
                isMobile && "text-lg"
              )}>{value}</p>
              
              {change !== undefined && (
                <div className={cn("flex items-center gap-1.5 text-sm", isMobile && "text-xs gap-1")}>
                  {isPositive && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success font-medium",
                      isMobile && "px-1.5 py-0.5 gap-0.5"
                    )}>
                      <TrendingUp className={cn("h-3.5 w-3.5", isMobile && "h-3 w-3")} />
                      +{change.toFixed(1)}%
                    </span>
                  )}
                  {isNegative && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium",
                      isMobile && "px-1.5 py-0.5 gap-0.5"
                    )}>
                      <TrendingDown className={cn("h-3.5 w-3.5", isMobile && "h-3 w-3")} />
                      {change.toFixed(1)}%
                    </span>
                  )}
                  {isNeutral && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium",
                      isMobile && "px-1.5 py-0.5 gap-0.5"
                    )}>
                      <Minus className={cn("h-3.5 w-3.5", isMobile && "h-3 w-3")} />
                      0%
                    </span>
                  )}
                  {changeLabel && !isMobile && (
                    <span className="text-muted-foreground text-xs">{changeLabel}</span>
                  )}
                </div>
              )}

              {progress && (
                <div className={cn("space-y-1.5 mt-2", isMobile && "mt-1.5 space-y-1")}>
                  <Progress 
                    value={Math.min((progress.current / progress.target) * 100, 100)} 
                    className={cn("h-2", isMobile && "h-1.5")} 
                  />
                  <div className={cn("flex items-center justify-between text-xs text-muted-foreground", isMobile && "text-[10px]")}>
                    <span>{Math.min((progress.current / progress.target) * 100, 100).toFixed(0)}% da meta</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sparkline as background decoration - clickable to expand */}
          {!isMobile && sparklineData && sparklineData.length > 0 && (
            <div 
              className="absolute right-2 bottom-2 w-36 h-16 z-10 opacity-60 group-hover:opacity-90 transition-all cursor-pointer p-2 rounded-lg hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              role="button"
              aria-label={`Ver evolução diária de ${title}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDialogOpen(true);
                }
              }}
            >
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
                <div className="bg-primary/10 rounded-full p-1">
                  <Maximize2 className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`sparklineGradient-${title.replace(/\s/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill={`url(#sparklineGradient-${title.replace(/\s/g, '-')})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded sparkline dialog */}
      {sparklineData && sparklineData.length > 0 && (
        <SparklineDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={title}
          data={sparklineData}
          formatValue={formatSparklineValue}
        />
      )}
    </motion.div>
  );
}
