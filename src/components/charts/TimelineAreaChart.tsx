import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE } from "./chartConfig";
import { AreaChart as AreaChartIcon } from "lucide-react";

interface TimelineDataPoint {
  date: string;
  leads: number;
}

interface TimelineAreaChartProps {
  title: string;
  data: TimelineDataPoint[];
  height?: number;
  color?: string;
  gradientId?: string;
  delay?: number;
  loading?: boolean;
}

function AreaChartSkeleton({ height }: { height: number }) {
  return (
    <div className="flex flex-col justify-end px-2" style={{ height }}>
      <div className="flex items-end gap-1 h-[80%]">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i}
            className="flex-1 rounded-t"
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 30}ms`
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8" />
        ))}
      </div>
    </div>
  );
}

export function TimelineAreaChart({
  title,
  data,
  height = 250,
  color = "hsl(var(--chart-1))",
  gradientId = "colorLeads",
  delay = 0,
  loading = false,
}: TimelineAreaChartProps) {
  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <ChartCard
        title={title}
        icon={AreaChartIcon}
        delay={delay}
        loading={loading}
        loadingSkeleton={<AreaChartSkeleton height={height} />}
      >
        <div 
          className="flex flex-col items-center justify-center text-muted-foreground"
          style={{ height }}
        >
          <AreaChartIcon className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">Sem dados de evolução disponíveis</p>
          <p className="text-xs opacity-70">Nenhum lead registrado no período</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={title}
      icon={AreaChartIcon}
      delay={delay}
      loading={loading}
      loadingSkeleton={<AreaChartSkeleton height={height} />}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="date" fontSize={11} {...AXIS_STYLE} />
          <YAxis fontSize={11} {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="leads"
            stroke={color}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationBegin={delay}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
