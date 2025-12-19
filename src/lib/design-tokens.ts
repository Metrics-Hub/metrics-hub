// ============================================
// Design Tokens - Sistema de Design Centralizado
// ============================================

// -------------------- CORES --------------------

// Cores de gráficos (referências para CSS variables)
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(195 74% 45%)",
  "hsl(280 60% 55%)",
  "hsl(35 90% 55%)",
  "hsl(165 60% 45%)",
  "hsl(350 65% 55%)",
] as const;

// Cores semânticas para tags/badges
export const TAG_COLORS = {
  novo: "bg-chart-1 text-primary-foreground",
  qualificado: "bg-success text-success-foreground",
  emContato: "bg-warning text-warning-foreground",
  hot: "bg-destructive text-destructive-foreground",
  frio: "bg-muted text-muted-foreground",
} as const;

// Cores para status
export const STATUS_COLORS = {
  active: "bg-success/15 text-success border-success/30",
  paused: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/15 text-destructive border-destructive/30",
} as const;

// -------------------- ESPAÇAMENTO --------------------

export const SPACING = {
  // Gaps entre elementos
  section: "gap-6",        // Entre seções principais
  cards: "gap-4",          // Entre cards de gráficos/KPIs
  cardContent: "gap-3",    // Dentro de cards
  inline: "gap-2",         // Entre elementos inline (ícones e texto)
  
  // Padding
  container: "px-4 py-6",  // Container principal
  card: "p-5",             // Padding interno de cards
  cardHeader: "pb-2",      // Header de card
  subsection: "p-5",       // Subsections (ex: grupos de gráficos)
} as const;

// -------------------- TIPOGRAFIA --------------------

export const TYPOGRAPHY = {
  // Tamanhos de título
  pageTitle: "text-xl font-semibold",
  sectionTitle: "text-lg font-semibold",
  cardTitle: "text-base font-medium",
  subsectionTitle: "text-base font-medium",
  
  // Tamanhos de texto
  body: "text-sm",
  small: "text-xs",
  muted: "text-muted-foreground",
  
  // Tamanhos específicos para gráficos
  chartAxis: 11,
  chartTooltip: 12,
  chartLabel: 11,
  chartLegend: 12,
} as const;

// -------------------- ALTURAS --------------------

export const HEIGHTS = {
  // Alturas de gráficos
  chart: {
    timeline: 280,
    distribution: 220,
    performance: 300,
    sparkline: 40,
    mini: 150,
  },
  
  // Alturas de componentes UI
  button: {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  },
  
  input: {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  },
} as const;

// -------------------- LARGURAS --------------------

export const WIDTHS = {
  // Larguras de labels em gráficos de barra
  chartLabel: {
    sm: 80,
    md: 120,
    lg: 160,
    xl: 180,
  },
  
  // Larguras de containers
  sidebar: "w-60",
  sidebarCollapsed: "w-14",
} as const;

// -------------------- ANIMAÇÕES --------------------

export const ANIMATION = {
  // Delays em ms
  delay: {
    base: 50,
    increment: 50,
  },
  
  // Durações
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    chart: 800,
  },
  
  // Easing (Framer Motion format)
  easing: {
    default: "easeOut" as const,
    smooth: [0.4, 0, 0.2, 1] as const,
  },
} as const;

// -------------------- GRID LAYOUTS --------------------

export const GRID = {
  // KPI Cards
  kpiCards: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  kpiCardsLarge: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  
  // Distribution charts
  distributionCharts: "grid-cols-1 lg:grid-cols-2",
  distributionChartsTriple: "grid-cols-1 sm:grid-cols-3",
  distributionChartsDouble: "grid-cols-1 sm:grid-cols-2",
  
  // Rankings
  rankings: "grid-cols-1 md:grid-cols-2",
} as const;

// -------------------- ESTILOS DE GRÁFICOS --------------------

export const CHART_STYLES = {
  // Estilo de tooltip padronizado
  tooltip: {
    contentStyle: {
      backgroundColor: "hsl(var(--popover) / 0.95)",
      backdropFilter: "blur(8px)",
      border: "1px solid hsl(var(--border) / 0.5)",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 500 },
    itemStyle: { color: "hsl(var(--foreground))" },
  },
  
  // Estilo de grid
  grid: {
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border))",
    opacity: 0.5,
  },
  
  // Estilo de eixo
  axis: {
    stroke: "hsl(var(--muted-foreground))",
    tickLine: false,
    axisLine: false,
  },
} as const;

// -------------------- SOMBRAS --------------------

export const SHADOWS = {
  card: "shadow-sm",
  cardHover: "shadow-lg shadow-primary/5",
  dropdown: "shadow-lg",
  modal: "shadow-xl",
} as const;

// -------------------- BORDAS --------------------

export const BORDERS = {
  radius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  },
  
  width: {
    thin: "border",
    medium: "border-2",
  },
  
  style: {
    default: "border-border",
    subtle: "border-border/50",
    primary: "border-primary/30",
  },
} as const;

// -------------------- BREAKPOINTS --------------------

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// -------------------- UTILITÁRIOS --------------------

// Calcula delay de animação baseado no índice
export function getAnimationDelay(index: number, baseDelay: number = 0): number {
  return baseDelay + (index * ANIMATION.delay.increment);
}

// Adiciona cores aos dados de distribuição
export function addColorsToData<T extends { name: string; value: number }>(
  data: T[]
): (T & { color: string })[] {
  return data.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

// Configuração de animação Framer Motion para gráficos
export const chartAnimation = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  viewport: { once: true, margin: "-50px" },
  transition: {
    duration: ANIMATION.duration.slow / 1000,
    delay: delay / 1000,
    ease: ANIMATION.easing.default,
  },
});

// Configuração de animação Framer Motion para cards
export const cardAnimation = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: ANIMATION.duration.normal / 1000,
    delay: delay / 1000,
    ease: ANIMATION.easing.default,
  },
});
