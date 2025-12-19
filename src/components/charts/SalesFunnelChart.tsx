import * as React from "react";

import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FunnelStage } from "@/hooks/useFunnelData";
import { CHART_STYLES, TYPOGRAPHY } from "@/lib/design-tokens";
import { ArrowDown, Filter } from "lucide-react";

interface SalesFunnelChartProps {
  title: string;
  icon?: React.ReactNode;
  data: FunnelStage[];
  height?: number;
  loading?: boolean;
  delay?: number;
  showConversionRates?: boolean;
}

// Formatar número para exibição
function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString("pt-BR");
}

// Tooltip customizado
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as FunnelStage;

  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={CHART_STYLES.tooltip.contentStyle}
    >
      <p className="font-medium mb-1">{data.name}</p>
      <p className="text-foreground">
        {data.value.toLocaleString("pt-BR")}
      </p>
      {data.conversionRate !== undefined && data.previousStage && (
        <p className="text-muted-foreground text-xs mt-1">
          Taxa: {data.conversionRate.toFixed(1)}% de {data.previousStage}
        </p>
      )}
    </div>
  );
}

const FunnelSkeleton = React.forwardRef<HTMLDivElement, { height: number }>(
  ({ height }, ref) => {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center gap-2" style={{ height }}>
        {[100, 85, 70, 55, 40].map((width, i) => (
          <Skeleton
            key={i}
            className="rounded-sm"
            style={{ width: `${width}%`, height: `${(height - 40) / 5}px` }}
          />
        ))}
      </div>
    );
  }
);

FunnelSkeleton.displayName = "FunnelSkeleton";

// Componente de taxas de conversão lateral
function ConversionRatesSidebar({ data }: { data: FunnelStage[] }) {
  return (
    <div className="flex flex-col justify-center gap-2 text-xs min-w-[80px]">
      {data.slice(1).map((stage) => (
        <div key={stage.name} className="flex items-center gap-1 text-muted-foreground">
          <ArrowDown className="h-3 w-3" />
          <span className="font-medium">
            {stage.conversionRate?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function SalesFunnelChart({
  title,
  data,
  height = 300,
  loading = false,
  delay = 0,
  showConversionRates = true,
}: SalesFunnelChartProps) {
  // Check if all values are zero (effectively empty funnel)
  const totalValue = data.reduce((sum, stage) => sum + stage.value, 0);
  const isEffectivelyEmpty = totalValue === 0;

  // Filtrar estágios com valor 0 do final (manter zeros intermediários)
  const filteredData = data.filter((stage, index) => {
    // Se for o último estágio e for 0, remover
    if (index === data.length - 1 && stage.value === 0) {
      return false;
    }
    return true;
  });

  // Show empty state when no data or all values are zero
  if (!data || data.length === 0 || isEffectivelyEmpty) {
    return (
      <ChartCard
        title={title}
        icon={Filter}
        delay={delay}
        loading={loading}
        loadingSkeleton={<FunnelSkeleton height={height} />}
      >
        <div 
          className="flex flex-col items-center justify-center text-muted-foreground"
          style={{ height }}
        >
          <Filter className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">Sem dados para o funil</p>
          <p className="text-xs opacity-70">Nenhum lead qualificado no período</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={title}
      icon={Filter}
      delay={delay}
      loading={loading}
      loadingSkeleton={<FunnelSkeleton height={height} />}
    >
      <div className="flex items-stretch">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={height}>
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                data={filteredData}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {filteredData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="none"
                  />
                ))}
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  fontSize={TYPOGRAPHY.chartLabel}
                  formatter={(value: number) => formatValue(value)}
                  className="font-medium"
                />
                <LabelList
                  position="center"
                  fill="hsl(var(--primary-foreground))"
                  fontSize={TYPOGRAPHY.chartLabel}
                  dataKey="name"
                  className="font-medium"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
        {showConversionRates && filteredData.length > 1 && (
          <ConversionRatesSidebar data={filteredData} />
        )}
      </div>

      {/* Legenda inferior com resumo */}
      {filteredData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            {filteredData.map((stage) => (
              <div key={stage.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: stage.fill }}
                />
                <span className="text-muted-foreground">{stage.name}:</span>
                <span className="font-medium">{formatValue(stage.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
