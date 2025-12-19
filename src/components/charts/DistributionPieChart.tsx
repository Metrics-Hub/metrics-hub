import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { TOOLTIP_STYLE, ChartDataItem, chartAnimation } from "./chartConfig";
import { PieChart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DistributionPieChartProps {
  title: string;
  data: ChartDataItem[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "right";
  legendFontSize?: string;
  cy?: string;
  delay?: number;
  loading?: boolean;
  compactLegend?: boolean;
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <Skeleton className="rounded-full" style={{ width: height * 0.6, height: height * 0.6 }} />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function CustomLegend({ data, compact = false }: { data: ChartDataItem[]; compact?: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1.5 justify-center ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {data.map((entry, index) => {
        const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
        return (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground truncate max-w-[100px]" title={entry.name}>
              {compact ? entry.name.split(' ')[0] : entry.name}
            </span>
            <span className="font-medium text-foreground">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function DistributionPieChart({
  title,
  data,
  height = 220,
  innerRadius = 50,
  outerRadius = 80,
  showLegend = true,
  legendPosition = "bottom",
  legendFontSize = "12px",
  cy = "50%",
  delay = 0,
  loading = false,
  compactLegend = false,
}: DistributionPieChartProps) {
  const isMobile = useIsMobile();
  
  // Responsive adjustments
  const effectiveHeight = isMobile ? Math.min(height, 180) : height;
  const effectiveInnerRadius = isMobile ? Math.min(innerRadius, 35) : innerRadius;
  const effectiveOuterRadius = isMobile ? Math.min(outerRadius, 55) : outerRadius;
  const chartHeight = showLegend && legendPosition === "bottom" ? effectiveHeight - 50 : effectiveHeight;
  
  // Empty state handling
  if (!loading && (!data || data.length === 0)) {
    return (
      <motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">
        <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 md:p-6">
            <div 
              className="flex flex-col items-center justify-center text-muted-foreground" 
              style={{ height: effectiveHeight }}
            >
              <PieChart className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Sem dados disponíveis</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6">
          {loading ? (
            <ChartSkeleton height={effectiveHeight} />
          ) : (
            <div className="flex flex-col">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <RechartsPieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy={cy}
                    innerRadius={effectiveInnerRadius}
                    outerRadius={effectiveOuterRadius}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    animationBegin={delay}
                    animationDuration={800}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </RechartsPieChart>
              </ResponsiveContainer>
              {showLegend && (
                <div className="mt-1 md:mt-2">
                  <CustomLegend data={data} compact={compactLegend || isMobile} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
