import { useIsMobile } from "./use-mobile";

export function useResponsiveChartConfig() {
  const isMobile = useIsMobile();

  return {
    // Labels
    labelWidth: isMobile ? 70 : 120,
    labelWidthMedium: isMobile ? 85 : 140,
    labelWidthLarge: isMobile ? 100 : 180,
    labelFontSize: isMobile ? 9 : 11,
    maxLabelChars: isMobile ? 12 : 25,
    maxLabelCharsMedium: isMobile ? 14 : 22,

    // Chart heights - reduced for mobile
    chartHeight: isMobile ? 160 : 220,
    chartHeightMedium: isMobile ? 180 : 250,
    chartHeightLarge: isMobile ? 200 : 300,
    timelineHeight: isMobile ? 180 : 280,
    stackedHeight: isMobile ? 200 : 280,
    projectionHeight: isMobile ? 220 : 300,

    // Pie charts - smaller on mobile
    pieInnerRadius: isMobile ? 30 : 50,
    pieOuterRadius: isMobile ? 50 : 80,

    // Stacked bar
    stackedLabelWidth: isMobile ? 75 : 140,
    stackedMaxChars: isMobile ? 12 : 22,

    // Axis configuration
    axisInterval: isMobile ? 2 : "preserveStartEnd" as const,
    axisFontSize: isMobile ? 9 : 11,
    yAxisWidth: isMobile ? 32 : 50,

    // Tooltip and interaction
    activeDotRadius: isMobile ? 6 : 4,
    dotRadius: isMobile ? 0 : 0,

    // Margins
    chartMargin: isMobile 
      ? { top: 5, right: 8, left: 0, bottom: 5 }
      : { top: 10, right: 20, left: 10, bottom: 10 },

    // Grid columns for stats
    statsGridCols: isMobile ? "grid-cols-2" : "grid-cols-5",

    // Flag for conditional rendering
    isMobile,
  };
}
