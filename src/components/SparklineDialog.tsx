import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TOOLTIP_STYLE } from "./charts/chartConfig";

interface SparklineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: number[];
  formatValue?: (value: number) => string;
}

export function SparklineDialog({
  open,
  onOpenChange,
  title,
  data,
  formatValue = (v) => v.toLocaleString("pt-BR"),
}: SparklineDialogProps) {
  const chartData = data.map((value, index) => ({
    day: index + 1,
    value,
  }));

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const avgValue = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{title} - Evolução Diária</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Mínimo</p>
              <p className="text-sm font-semibold text-foreground">{formatValue(minValue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Média</p>
              <p className="text-sm font-semibold text-foreground">{formatValue(avgValue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="text-sm font-semibold text-foreground">{formatValue(maxValue)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="expandedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `D${value}`}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                    return value.toFixed(value < 10 ? 2 : 0);
                  }}
                  width={50}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  labelFormatter={(label) => `Dia ${label}`}
                  formatter={(value: number) => [formatValue(value), title]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#expandedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {data.length} dias no período selecionado
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
