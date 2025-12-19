# Design System - Documentação de Referência

> Última atualização: Dezembro 2024

Este documento descreve os padrões visuais e de código utilizados nos componentes do dashboard.

---

## 📋 Índice

1. [Padrão de Cards](#padrão-de-cards)
2. [Componentes Padronizados](#componentes-padronizados)
3. [Tokens de Design](#tokens-de-design)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Checklist de Padronização](#checklist-de-padronização)

---

## Padrão de Cards

### 🎯 Componente ChartCard (Recomendado)

Para novos componentes, use o wrapper `ChartCard` que encapsula todo o padrão automaticamente:

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { BarChart3 } from "lucide-react";

<ChartCard
  title="Meu Gráfico"
  icon={BarChart3}
  delay={0.1}
  loading={isLoading}
  headerAction={<Badge>Extra</Badge>}
>
  <ResponsiveContainer width="100%" height={200}>
    {/* Gráfico aqui */}
  </ResponsiveContainer>
</ChartCard>
```

#### Props do ChartCard

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | obrigatório | Título do card |
| `icon` | `LucideIcon` | obrigatório | Ícone do título |
| `children` | `ReactNode` | obrigatório | Conteúdo do card |
| `delay` | `number` | `0` | Delay da animação (em segundos) |
| `loading` | `boolean` | `false` | Mostra skeleton durante loading |
| `headerAction` | `ReactNode` | - | Elemento à direita do título |
| `customHeader` | `ReactNode` | - | Header customizado (substitui título padrão) |
| `onClick` | `function` | - | Handler de clique |
| `skeletonHeight` | `number` | `200` | Altura do skeleton |
| `loadingSkeleton` | `ReactNode` | - | Skeleton customizado para loading |
| `className` | `string` | - | Classes adicionais do Card |
| `contentClassName` | `string` | - | Classes adicionais do CardContent |
| `headerClassName` | `string` | - | Classes adicionais do CardHeader |

### Estrutura Manual (Legado)

Para casos especiais onde o ChartCard não atende, use a estrutura manual:

```tsx
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartAnimation } from "@/lib/design-tokens"; // ou cardAnimation

<motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">
  <Card 
    variant="glass" 
    className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5"
  >
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0 p-3 md:p-6">
      {/* Conteúdo */}
    </CardContent>
  </Card>
</motion.div>
```

### Regras Obrigatórias

| Elemento | Classe/Prop | Descrição |
|----------|-------------|-----------|
| `motion.div` | `className="cursor-pointer h-full"` | Wrapper com animação |
| `Card` | `variant="glass"` | Efeito glassmorphism |
| `Card` | `className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5"` | Altura total e hover |
| `CardHeader` | `className="pb-2"` | Padding bottom padronizado |
| `CardTitle` | `className="text-sm font-medium flex items-center gap-2"` | Tipografia padronizada |
| `Icon` | `className="h-4 w-4 text-primary"` | Tamanho e cor do ícone |
| `CardContent` | `className="pt-0 p-3 md:p-6"` | Padding responsivo |

---

## Componentes Padronizados

### ✅ Gráficos usando ChartCard

| Componente | Arquivo | Usa ChartCard | Observação |
|------------|---------|---------------|------------|
| TimelineAreaChart | `src/components/charts/TimelineAreaChart.tsx` | ✅ Sim | Gráfico de área simples |
| SalesFunnelChart | `src/components/charts/SalesFunnelChart.tsx` | ✅ Sim | Funil de vendas |
| StackedBarChart | `src/components/charts/StackedBarChart.tsx` | ✅ Sim | Com `headerAction` para toggle de ordenação |
| TimelineChart | `src/components/TimelineChart.tsx` | ✅ Sim | Com `customHeader` para badges interativos |
| EfficiencyTrendChart | `src/components/EfficiencyTrendChart.tsx` | ✅ Sim | Com `customHeader` para badges + médias |

### ✅ Gráficos com estrutura manual (casos especiais)

| Componente | Arquivo | Motivo |
|------------|---------|--------|
| GoalProjectionChart | `src/components/GoalProjectionChart.tsx` | Header muito complexo com Switch e Badge |
| DistributionPieChart | `src/components/charts/DistributionPieChart.tsx` | Estrutura simples já consistente |
| DistributionBarChart | `src/components/charts/DistributionBarChart.tsx` | Estrutura simples já consistente |
| SparklineDialog | `src/components/SparklineDialog.tsx` | Usa Dialog, não Card |

### ✅ Painéis e Cards

| Componente | Arquivo | Status |
|------------|---------|--------|
| KPICard | `src/components/KPICard.tsx` | ✅ Consistente (componente base) |
| RankingTable | `src/components/RankingTable.tsx` | ✅ Padronizado manualmente |
| QualificationMetricsPanel | `src/components/QualificationMetricsPanel.tsx` | ✅ Padronizado manualmente |
| ConversionKPICards | `src/components/ConversionKPICards.tsx` | ✅ Padronizado manualmente |

### ✅ Alertas e Insights

| Componente | Arquivo | Status |
|------------|---------|--------|
| SmartAlerts | `src/components/SmartAlerts.tsx` | ✅ Padronizado manualmente |
| AIInsightsPanel | `src/components/AIInsightsPanel.tsx` | ✅ Padronizado manualmente |
| AlertHistorySection | `src/components/AlertHistorySection.tsx` | ✅ Padronizado manualmente |

### ✅ Componentes Compostos (usam KPICard)

| Componente | Arquivo | Status |
|------------|---------|--------|
| GoalCard | `src/components/dashboard/GoalCard.tsx` | ✅ Usa KPICard |
| LeadGoalCard | `src/components/LeadGoalCard.tsx` | ✅ Usa KPICard |

### ✅ Componentes Admin (padronizados com variant="glass")

| Componente | Arquivo | Status |
|------------|---------|--------|
| AlertsTab | `src/components/admin/AlertsTab.tsx` | ✅ Padronizado |
| AuditLogsTab | `src/components/admin/AuditLogsTab.tsx` | ✅ Padronizado |
| IntegrationsTab | `src/components/admin/IntegrationsTab.tsx` | ✅ Padronizado |
| LeadScoringTab | `src/components/admin/LeadScoringTab.tsx` | ✅ Padronizado |
| SettingsTab | `src/components/admin/SettingsTab.tsx` | ✅ Padronizado |
| SyncConfigTab | `src/components/admin/SyncConfigTab.tsx` | ✅ Padronizado |
| UsersTab | `src/components/admin/UsersTab.tsx` | ✅ Padronizado |
| WhiteLabelTab | `src/components/admin/WhiteLabelTab.tsx` | ✅ Padronizado |
| UserStatsPanel | `src/components/admin/UserStatsPanel.tsx` | ✅ Consistente |

### ⚪ Utilitários (sem Card)

| Componente | Arquivo | Observação |
|------------|---------|------------|
| DataSourceSelector | `src/components/DataSourceSelector.tsx` | Não usa Card |
| DataSourceBadge | `src/components/DataSourceBadge.tsx` | Não usa Card |
| FilterChips | `src/components/FilterChips.tsx` | Não usa Card |

---

## Tokens de Design

### Importações Necessárias

```tsx
// Para animações
import { chartAnimation, cardAnimation } from "@/lib/design-tokens";

// Para estilos de gráficos
import { TOOLTIP_STYLE, GRID_STYLE, AXIS_STYLE } from "@/components/charts/chartConfig";
```

### Animações

```tsx
// Para gráficos (com delay opcional)
<motion.div {...chartAnimation(delay)} className="cursor-pointer h-full">

// Para cards genéricos
<motion.div {...cardAnimation(delay)} className="cursor-pointer h-full">
```

### Cores Semânticas

| Token | Uso |
|-------|-----|
| `text-primary` | Cor principal para ícones e destaques |
| `text-muted-foreground` | Texto secundário |
| `text-foreground` | Texto principal |
| `bg-muted/30` | Fundos sutis |
| `border-border/50` | Bordas sutis |

### Tipografia

| Classe | Uso |
|--------|-----|
| `text-sm font-medium` | Títulos de cards |
| `text-xs` | Subtítulos e labels |
| `text-[10px]` | Labels muito pequenos (mobile) |
| `text-2xl font-bold` | Valores principais |

### Espaçamento Responsivo

| Mobile | Desktop | Classe |
|--------|---------|--------|
| `p-3` | `p-6` | `p-3 md:p-6` |
| `gap-2` | `gap-4` | `gap-2 md:gap-4` |
| `h-4 w-4` | `h-4 w-4` | Ícones sempre `h-4 w-4` |

---

## Exemplos de Uso

### Gráfico Simples com ChartCard

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { BarChart3 } from "lucide-react";

export function MeuGrafico({ title, data, loading }) {
  return (
    <ChartCard
      title={title}
      icon={BarChart3}
      loading={loading}
      skeletonHeight={200}
    >
      <ResponsiveContainer width="100%" height={200}>
        {/* Gráfico aqui */}
      </ResponsiveContainer>
    </ChartCard>
  );
}
```

### Gráfico com Header Action (Badge/Botão)

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

<ChartCard
  title="Vendas por Região"
  icon={BarChart3}
  headerAction={<Badge variant="secondary">Últimos 30 dias</Badge>}
>
  {/* Conteúdo */}
</ChartCard>
```

### Gráfico com Header Customizado (Badges Interativos)

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const customHeader = (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-primary" />
      Evolução Temporal
    </CardTitle>
    <div className="flex gap-1.5">
      {/* Badges interativos aqui */}
    </div>
  </div>
);

<ChartCard
  title="Evolução Temporal"
  icon={TrendingUp}
  customHeader={customHeader}
>
  {/* Gráfico */}
</ChartCard>
```

### Gráfico com Skeleton Customizado

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";

function CustomSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

<ChartCard
  title="Dados"
  icon={BarChart3}
  loading={isLoading}
  loadingSkeleton={<CustomSkeleton />}
>
  {/* Conteúdo */}
</ChartCard>
```

---

## Checklist de Padronização

Use esta checklist ao criar ou revisar componentes:

### Motion Wrapper
- [ ] `motion.div` com `chartAnimation(delay)` ou `cardAnimation(delay)`
- [ ] `className="cursor-pointer h-full"`

### Card
- [ ] `variant="glass"`
- [ ] `className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5"`

### CardHeader
- [ ] `className="pb-2"`

### CardTitle
- [ ] `className="text-sm font-medium flex items-center gap-2"`
- [ ] Ícone com `className="h-4 w-4 text-primary"`

### CardContent
- [ ] `className="pt-0 p-3 md:p-6"`

### Gráficos (se aplicável)
- [ ] Usar `TOOLTIP_STYLE` do chartConfig
- [ ] Usar `GRID_STYLE` do chartConfig
- [ ] Usar `AXIS_STYLE` do chartConfig

### Loading State
- [ ] Usar `<Skeleton />` com altura apropriada
- [ ] Manter estrutura do Card durante loading

---

## Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/design-tokens.ts` | Tokens de design centralizados |
| `src/components/charts/chartConfig.ts` | Configurações de gráficos |
| `src/components/ui/card.tsx` | Componente Card com variantes |
| `src/components/ui/chart-card.tsx` | Wrapper ChartCard reutilizável |
| `src/index.css` | Variáveis CSS e temas |
| `tailwind.config.ts` | Configuração do Tailwind |

---

## Histórico de Padronização

| Data | Componentes | Descrição |
|------|-------------|-----------|
| Dez/2024 | ChartCard | Criado componente wrapper reutilizável |
| Dez/2024 | ChartCard | Adicionado props `customHeader` e `loadingSkeleton` |
| Dez/2024 | TimelineChart | Refatorado para usar ChartCard com customHeader |
| Dez/2024 | EfficiencyTrendChart | Refatorado para usar ChartCard com customHeader |
| Dez/2024 | TimelineAreaChart | Refatorado para usar ChartCard |
| Dez/2024 | SalesFunnelChart | Refatorado para usar ChartCard |
| Dez/2024 | StackedBarChart | Refatorado para usar ChartCard com headerAction |
| Dez/2024 | GoalProjectionChart | Padronizado com variant="glass" (estrutura manual) |
| Dez/2024 | SparklineDialog | Padronizado TOOLTIP_STYLE |
| Dez/2024 | RankingTable, QualificationMetricsPanel | Padronizado estrutura completa |
| Dez/2024 | SmartAlerts, AIInsightsPanel | Padronizado ícones e tipografia |
| Dez/2024 | ConversionKPICards, AlertHistorySection | Padronizado estrutura completa |
