import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE, ChartDataItem, chartAnimation } from "./chartConfig";
import { BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DistributionBarChartProps {
  title: string;
  data: ChartDataItem[];
  height?: number;
  color?: string;
  labelWidth?: number;
  labelFontSize?: number;
  delay?: number;
  loading?: boolean;
  maxLabelChars?: number;
}

function BarChartSkeleton({ height, rows = 5 }: { height: number; rows?: number }) {
  return (
    <div className="flex flex-col justify-center gap-3 px-2" style={{ height }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-16 flex-shrink-0" />
          <Skeleton 
            className="h-5 rounded-r" 
            style={{ 
              width: `${Math.random() * 40 + 30}%`,
              animationDelay: `${i * 50}ms`
            }} 
          />
        </div>
      ))}
    </div>
  );
}

export function DistributionBarChart({
  title,
  data,
  height = 220,
  color = "hsl(var(--chart-1))",
  labelWidth = 80,
  labelFontSize = 11,
  delay = 0,
  loading = false,
  maxLabelChars = 20,
}: DistributionBarChartProps) {
  const isMobile = useIsMobile();
  
  // Responsive adjustments
  const effectiveHeight = isMobile ? Math.min(height, 180) : height;
  const effectiveLabelWidth = isMobile ? Math.min(labelWidth, 80) : labelWidth;
  const effectiveFontSize = isMobile ? Math.min(labelFontSize, 10) : labelFontSize;
  const effectiveMaxChars = isMobile ? Math.min(maxLabelChars, 14) : maxLabelChars;
  
  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">
        <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 md:p-6">
            <div 
              className="flex flex-col items-center justify-center text-muted-foreground"
              style={{ height: effectiveHeight }}
            >
              <BarChart3 className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Sem dados disponíveis</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Truncate labels that are too long
  const truncatedData = data.map(item => ({
    ...item,
    displayName: item.name.length > effectiveMaxChars ? item.name.substring(0, effectiveMaxChars - 1) + '…' : item.name,
    fullName: item.name,
  }));

  return (
    <motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6">
          {loading ? (
            <BarChartSkeleton height={effectiveHeight} />
          ) : (
            <ResponsiveContainer width="100%" height={effectiveHeight}>
              <BarChart data={truncatedData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis
                  type="number"
                  fontSize={effectiveFontSize}
                  {...AXIS_STYLE}
                  tickFormatter={(value) => value.toLocaleString('pt-BR')}
                />
                <YAxis
                  dataKey="displayName"
                  type="category"
                  fontSize={effectiveFontSize}
                  width={effectiveLabelWidth}
                  {...AXIS_STYLE}
                  tick={({ x, y, payload }) => {
                    const item = truncatedData.find(d => d.displayName === payload.value);
                    const isTruncated = item && item.fullName !== item.displayName;
                    return (
                      <g style={{ cursor: isTruncated ? 'help' : 'default' }}>
                        <title>{item?.fullName || payload.value}</title>
                        <text
                          x={x}
                          y={y}
                          dy={4}
                          textAnchor="end"
                          fontSize={effectiveFontSize}
                          fill="hsl(var(--muted-foreground))"
                          style={{ 
                            textDecoration: isTruncated ? 'underline dotted' : 'none',
                            textUnderlineOffset: '2px'
                          }}
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <Tooltip 
                  {...TOOLTIP_STYLE}
                  formatter={(value: number, name: string, props: any) => [
                    value.toLocaleString('pt-BR'),
                    props.payload.fullName || name
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill={color}
                  radius={[0, 4, 4, 0]}
                  animationBegin={delay}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
