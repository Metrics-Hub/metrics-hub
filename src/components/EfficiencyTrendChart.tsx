import { useState, useMemo } from "react";
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
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE } from "./charts/chartConfig";
import { useResponsiveChartConfig } from "@/hooks/useResponsiveChartConfig";

interface SparklineDataPoint {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  leads: number;
}

interface EfficiencyDataPoint {
  date: string;
  cpl: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface MetricConfig {
  key: keyof Omit<EfficiencyDataPoint, "date">;
  label: string;
  color: string;
  tooltip: string;
  formatter: (value: number) => string;
  lowerIsBetter: boolean;
}

const metrics: MetricConfig[] = [
  {
    key: "cpl",
    label: "CPL",
    color: "hsl(var(--chart-1))",
    tooltip: "Custo por Lead - quanto menor, melhor a eficiência",
    formatter: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
    lowerIsBetter: true,
  },
  {
    key: "ctr",
    label: "CTR",
    color: "hsl(var(--chart-2))",
    tooltip: "Taxa de Cliques - quanto maior, melhor o engajamento",
    formatter: (v) => `${v.toFixed(2)}%`,
    lowerIsBetter: false,
  },
  {
    key: "cpc",
    label: "CPC",
    color: "hsl(var(--chart-3))",
    tooltip: "Custo por Clique - quanto menor, melhor a eficiência",
    formatter: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
    lowerIsBetter: true,
  },
  {
    key: "cpm",
    label: "CPM",
    color: "hsl(var(--chart-4))",
    tooltip: "Custo por Mil Impressões - quanto menor, maior o alcance por R$",
    formatter: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
    lowerIsBetter: true,
  },
];

interface EfficiencyTrendChartProps {
  data: SparklineDataPoint[];
  loading?: boolean;
}

function EfficiencyChartSkeleton({ height }: { height: number }) {
  return (
    <div style={{ height }} className="relative overflow-hidden rounded-xl">
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

function MetricBadges({ 
  selectedMetrics, 
  onToggle, 
  averages,
  isMobile 
}: { 
  selectedMetrics: string[]; 
  onToggle: (key: string) => void;
  averages: Record<string, number>;
  isMobile: boolean;
}) {
  return (
    <ScrollArea className="w-full sm:w-auto">
      <div className="flex gap-1.5 pb-1">
        {metrics.map((metric) => {
          const isSelected = selectedMetrics.includes(metric.key);
          const avg = averages[metric.key];
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
                  {metric.label}
                  {isSelected && avg !== undefined && !isMobile && (
                    <span className="ml-1 text-xs opacity-70">
                      (ø {metric.formatter(avg)})
                    </span>
                  )}
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

export function EfficiencyTrendChart({ data, loading = false }: EfficiencyTrendChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["cpl", "ctr"]);
  const chartConfig = useResponsiveChartConfig();

  const efficiencyData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((point) => {
      const cpl = point.leads > 0 ? point.spend / point.leads : 0;
      const ctr = point.impressions > 0 ? (point.clicks / point.impressions) * 100 : 0;
      const cpc = point.clicks > 0 ? point.spend / point.clicks : 0;
      const cpm = point.impressions > 0 ? (point.spend / point.impressions) * 1000 : 0;
      
      return {
        date: point.date,
        cpl: Number(cpl.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        cpc: Number(cpc.toFixed(2)),
        cpm: Number(cpm.toFixed(2)),
      };
    }).filter(point => point.cpl > 0 || point.ctr > 0);
  }, [data]);

  const averages = useMemo(() => {
    if (efficiencyData.length === 0) return {};
    
    const sums = { cpl: 0, ctr: 0, cpc: 0, cpm: 0, count: { cpl: 0, ctr: 0, cpc: 0, cpm: 0 } };
    efficiencyData.forEach(point => {
      if (point.cpl > 0) { sums.cpl += point.cpl; sums.count.cpl++; }
      if (point.ctr > 0) { sums.ctr += point.ctr; sums.count.ctr++; }
      if (point.cpc > 0) { sums.cpc += point.cpc; sums.count.cpc++; }
      if (point.cpm > 0) { sums.cpm += point.cpm; sums.count.cpm++; }
    });
    
    return {
      cpl: sums.count.cpl > 0 ? sums.cpl / sums.count.cpl : 0,
      ctr: sums.count.ctr > 0 ? sums.ctr / sums.count.ctr : 0,
      cpc: sums.count.cpc > 0 ? sums.cpc / sums.count.cpc : 0,
      cpm: sums.count.cpm > 0 ? sums.cpm / sums.count.cpm : 0,
    };
  }, [efficiencyData]);

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

  if (!efficiencyData || efficiencyData.length === 0) {
    return (
      <ChartCard
        title="Tendência de Eficiência"
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
        Tendência de Eficiência
      </CardTitle>
      <MetricBadges 
        selectedMetrics={selectedMetrics} 
        onToggle={toggleMetric}
        averages={averages}
        isMobile={chartConfig.isMobile}
      />
    </div>
  );

  return (
    <ChartCard
      title="Tendência de Eficiência"
      icon={TrendingUp}
      loading={loading}
      customHeader={customHeader}
      loadingSkeleton={<EfficiencyChartSkeleton height={chartConfig.timelineHeight} />}
    >
      <div style={{ height: chartConfig.timelineHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={efficiencyData} margin={chartConfig.chartMargin}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              {...AXIS_STYLE}
              fontSize={chartConfig.axisFontSize}
              interval={chartConfig.axisInterval}
            />
            <YAxis
              yAxisId="left"
              {...AXIS_STYLE}
              fontSize={chartConfig.axisFontSize}
              width={chartConfig.yAxisWidth}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toFixed(0);
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS_STYLE}
              fontSize={chartConfig.axisFontSize}
              width={chartConfig.yAxisWidth}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
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
                  yAxisId={metric.key === "ctr" ? "right" : "left"}
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
            {/* Reference lines for averages - hide on mobile */}
            {!chartConfig.isMobile && metrics
              .filter((m) => selectedMetrics.includes(m.key))
              .map((metric) => {
                const avg = averages[metric.key as keyof typeof averages];
                if (!avg) return null;
                return (
                  <ReferenceLine
                    key={`avg-${metric.key}`}
                    y={avg}
                    yAxisId={metric.key === "ctr" ? "right" : "left"}
                    stroke={metric.color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {!chartConfig.isMobile && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Linhas tracejadas indicam a média do período
        </p>
      )}
    </ChartCard>
  );
}
