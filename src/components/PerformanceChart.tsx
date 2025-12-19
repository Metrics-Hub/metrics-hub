import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE } from "./charts/chartConfig";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MetricConfig {
  key: string;
  label: string;
  color: string;
  format?: "number" | "currency" | "percent";
}

export interface PerformanceData {
  name: string;
  [key: string]: string | number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  loading?: boolean;
  title?: string;
  metric1: MetricConfig;
  metric2: MetricConfig;
}

const formatValue = (value: number, format?: "number" | "currency" | "percent") => {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    case "percent":
      return `${value.toFixed(2)}%`;
    default:
      return new Intl.NumberFormat("pt-BR").format(value);
  }
};

const formatAxisValue = (value: number, format?: "number" | "currency" | "percent") => {
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  if (format === "currency") return `R$${value.toFixed(0)}`;
  return value.toString();
};

export function PerformanceChart({ 
  data, 
  loading = false, 
  title = "Performance por Conjunto",
  metric1,
  metric2,
}: PerformanceChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 220 : 300;
  const fontSize = isMobile ? 9 : 11;
  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[220px] md:h-[300px] relative overflow-hidden rounded-xl">
            {/* Background shimmer */}
            <Skeleton className="absolute inset-0" />
            
            {/* Simulated bar chart */}
            <div className="absolute inset-0 flex items-end justify-around px-12 pb-12 gap-6">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex gap-1 items-end"
                >
                  <div 
                    className="w-6 rounded-t-md bg-chart-1/30"
                    style={{ 
                      height: `${40 + Math.random() * 40}%`,
                      animationDelay: `${i * 60}ms`
                    }}
                  />
                  <div 
                    className="w-6 rounded-t-md bg-chart-2/30"
                    style={{ 
                      height: `${50 + Math.random() * 35}%`,
                      animationDelay: `${i * 60 + 30}ms`
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Simulated grid lines */}
            <div className="absolute inset-x-12 top-4 bottom-12 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-border/20 w-full" />
              ))}
            </div>

            {/* Y-axis labels skeleton */}
            <div className="absolute top-4 bottom-12 left-2 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-3 w-8" 
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>

            {/* X-axis labels skeleton */}
            <div className="absolute bottom-2 left-12 right-4 flex justify-around">
              {[...Array(8)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-3 w-12" 
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>

            {/* Legend skeleton */}
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-chart-1/40" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-chart-2/40" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] md:h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={{ top: 5, right: isMobile ? 10 : 30, left: isMobile ? 0 : 20, bottom: 5 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="name"
              {...AXIS_STYLE}
              fontSize={fontSize}
              interval={isMobile ? 1 : 0}
              tick={{ fontSize }}
            />
            <YAxis
              yAxisId="left"
              {...AXIS_STYLE}
              fontSize={fontSize}
              tickFormatter={(value) => formatAxisValue(value, metric1.format)}
              width={isMobile ? 35 : 60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS_STYLE}
              fontSize={fontSize}
              tickFormatter={(value) => formatAxisValue(value, metric2.format)}
              width={isMobile ? 35 : 60}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value: number, name: string) => {
                const config = name === metric1.label ? metric1 : metric2;
                return [formatValue(value, config.format), name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "10px" }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
              )}
            />
            <Bar
              yAxisId="left"
              dataKey={metric1.key}
              name={metric1.label}
              fill={metric1.color}
              radius={[6, 6, 0, 0]}
              className="transition-opacity hover:opacity-80"
            />
            <Bar
              yAxisId="right"
              dataKey={metric2.key}
              name={metric2.label}
              fill={metric2.color}
              radius={[6, 6, 0, 0]}
              className="transition-opacity hover:opacity-80"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
