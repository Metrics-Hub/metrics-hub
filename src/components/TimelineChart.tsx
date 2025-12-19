import { useState } from "react";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChartCard } from "@/components/ui/chart-card";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE } from "./charts/chartConfig";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useResponsiveChartConfig } from "@/hooks/useResponsiveChartConfig";

interface TimelineDataPoint {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  leads: number;
}

interface MetricConfig {
  key: keyof Omit<TimelineDataPoint, "date">;
  label: string;
  color: string;
  tooltip: string;
  formatter: (value: number) => string;
}

const metrics: MetricConfig[] = [
  {
    key: "spend",
    label: "Investimento",
    color: "hsl(var(--chart-1))",
    tooltip: "Valor total investido em anúncios no período",
    formatter: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
  },
  {
    key: "impressions",
    label: "Impressões",
    color: "hsl(var(--chart-2))",
    tooltip: "Número de vezes que seus anúncios foram exibidos",
    formatter: (v) => new Intl.NumberFormat("pt-BR").format(v),
  },
  {
    key: "clicks",
    label: "Cliques",
    color: "hsl(var(--chart-3))",
    tooltip: "Quantidade de cliques nos seus anúncios",
    formatter: (v) => new Intl.NumberFormat("pt-BR").format(v),
  },
  {
    key: "reach",
    label: "Alcance",
    color: "hsl(var(--chart-4))",
    tooltip: "Número de pessoas únicas que viram seus anúncios",
    formatter: (v) => new Intl.NumberFormat("pt-BR").format(v),
  },
  {
    key: "leads",
    label: "Leads",
    color: "hsl(var(--chart-5))",
    tooltip: "Quantidade de contatos ou cadastros gerados",
    formatter: (v) => new Intl.NumberFormat("pt-BR").format(v),
  },
];

interface TimelineChartProps {
  data: TimelineDataPoint[];
  loading?: boolean;
}

function TimelineChartSkeleton({ height }: { height: number }) {
  return (
    <div style={{ height }} className="relative overflow-hidden rounded-xl">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-end justify-around px-8 pb-12 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1">
            <div 
              className="w-full max-w-[4px] rounded-full bg-primary/20"
              style={{ 
                height: `${30 + Math.sin(i * 0.8) * 20 + Math.random() * 30}%`,
                animationDelay: `${i * 40}ms`
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-12 right-4 h-px bg-border/30" />
      <div className="absolute top-4 bottom-8 left-12 w-px bg-border/30" />
    </div>
  );
}

function MetricBadges({ 
  selectedMetrics, 
  onToggle, 
  isMobile 
}: { 
  selectedMetrics: string[]; 
  onToggle: (key: string) => void;
  isMobile: boolean;
}) {
  return (
    <ScrollArea className="w-full sm:w-auto">
      <div className="flex gap-1.5 pb-1">
        {metrics.map((metric) => {
          const isSelected = selectedMetrics.includes(metric.key);
          return (
            <UITooltip key={metric.key}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all border backdrop-blur-sm flex-shrink-0 h-7 md:h-auto text-[10px] md:text-xs touch-target",
                    isSelected
                      ? "bg-primary/15 border-primary/40 shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border/50 opacity-60 hover:opacity-100 hover:bg-muted/50"
                  )}
                  style={isSelected ? { borderColor: metric.color, color: metric.color } : undefined}
                  onClick={() => onToggle(metric.key)}
                >
                  {isMobile ? metric.label.slice(0, 5) : metric.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <span>{metric.tooltip}</span>
              </TooltipContent>
            </UITooltip>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
}

export function TimelineChart({ data, loading = false }: TimelineChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["spend", "clicks"]);
  const chartConfig = useResponsiveChartConfig();
  
  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== key);
      }
      return [...prev, key];
    });
  };

  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTooltipLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (!data || data.length === 0) {
    return (
      <ChartCard
        title="Evolução Temporal"
        icon={TrendingUp}
        loading={false}
      >
        <div style={{ height: chartConfig.timelineHeight }} className="flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      </ChartCard>
    );
  }

  const customHeader = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Evolução Temporal
      </CardTitle>
      <MetricBadges 
        selectedMetrics={selectedMetrics} 
        onToggle={toggleMetric}
        isMobile={chartConfig.isMobile}
      />
    </div>
  );

  return (
    <ChartCard
      title="Evolução Temporal"
      icon={TrendingUp}
      loading={loading}
      customHeader={customHeader}
      loadingSkeleton={<TimelineChartSkeleton height={chartConfig.timelineHeight} />}
    >
      <div style={{ height: chartConfig.timelineHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartConfig.chartMargin}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              {...AXIS_STYLE}
              fontSize={chartConfig.axisFontSize}
              interval={chartConfig.axisInterval}
            />
            <YAxis
              {...AXIS_STYLE}
              fontSize={chartConfig.axisFontSize}
              width={chartConfig.yAxisWidth}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
            />
            <ChartTooltip
              {...TOOLTIP_STYLE}
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => {
                const metric = metrics.find((m) => m.key === name);
                return [metric?.formatter(value) || value, metric?.label || name];
              }}
            />
            {!chartConfig.isMobile && (
              <Legend
                wrapperStyle={{ paddingTop: "8px", fontSize: 11 }}
                formatter={(value) => {
                  const metric = metrics.find((m) => m.key === value);
                  return <span style={{ color: "hsl(var(--foreground))" }}>{metric?.label || value}</span>;
                }}
              />
            )}
            {metrics
              .filter((m) => selectedMetrics.includes(m.key))
              .map((metric, index) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={chartConfig.isMobile ? 1.5 : 2}
                  dot={false}
                  activeDot={{ r: chartConfig.activeDotRadius, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationBegin={index * 100}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
