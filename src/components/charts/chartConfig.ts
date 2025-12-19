// Chart configuration - Re-exports from centralized design tokens
// This file maintains backward compatibility with existing imports

export {
  CHART_COLORS,
  addColorsToData,
  getAnimationDelay,
  chartAnimation,
} from "@/lib/design-tokens";

export {
  CHART_STYLES,
  TYPOGRAPHY,
  HEIGHTS,
  ANIMATION,
} from "@/lib/design-tokens";

// Aliases for backward compatibility
import { CHART_STYLES, TYPOGRAPHY, HEIGHTS } from "@/lib/design-tokens";

export const TOOLTIP_STYLE = CHART_STYLES.tooltip;
export const GRID_STYLE = CHART_STYLES.grid;
export const AXIS_STYLE = CHART_STYLES.axis;

export const CHART_HEIGHTS = HEIGHTS.chart;
export const CHART_FONT_SIZES = {
  axisLabel: TYPOGRAPHY.chartAxis,
  tooltipValue: TYPOGRAPHY.chartTooltip,
};

// Chart data item interface
export interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
}
