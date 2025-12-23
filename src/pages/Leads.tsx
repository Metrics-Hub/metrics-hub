import { useMemo, useCallback, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { subDays, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  TrendingUp,
  ClipboardList,
  Percent,
  Activity,
  Star,
  User,
  Wallet,
  MessageCircle,
  Flame,
  BarChart3,
  Target,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPICard } from "@/components/KPICard";
import { LoadingProgress } from "@/components/LoadingProgress";
import { LeadsTable } from "@/components/LeadsTable";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ComparisonToggle } from "@/components/ComparisonToggle";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useLeadsFilters } from "@/hooks/useLeadsFilters";
import {
  DistributionPieChart,
  DistributionBarChart,
  TimelineAreaChart,
  StackedBarChart,
  SalesFunnelChart,
  SCORE_COLORS,
  addColorsToData,
} from "@/components/charts";
import { useQualificationFunnel, getConversionRate } from "@/hooks/useFunnelData";
import { QualificationMetricsPanel } from "@/components/QualificationMetricsPanel";
import { ScoreBySource } from "@/hooks/useLeadsData";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { useIntegrations } from "@/hooks/useIntegrations";
import { NoIntegrationAlert } from "@/components/NoIntegrationAlert";

// Format timeline date for display
function formatTimelineDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM');
  } catch {
    return dateStr;
  }
}

export default function Leads() {
  // Update document title
  useEffect(() => {
    document.title = "Leads - Launx Metrics";

    return () => {
      document.title = "Launx Metrics";
    };
  }, []);

  const { filters, updateFilters, resetFilters, isLoading: filtersLoading } = useLeadsFilters();
  const { projects, activeProject, setActiveProject, isLoading: projectsLoading } = useProjects();
  const { googleSheetsIntegrations } = useIntegrations(activeProject?.id || null);

  // Get first active Google Sheets integration for current project
  const activeSheetsIntegration = useMemo(() => {
    return googleSheetsIntegrations.find(i => i.is_active) || googleSheetsIntegrations[0] || null;
  }, [googleSheetsIntegrations]);

  // Convert persisted date strings to DateRange object
  const dateRange: DateRange | undefined = useMemo(() => {
    if (filters.dateRange.from || filters.dateRange.to) {
      return {
        from: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
        to: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
      };
    }
    // Default to last 30 days if no persisted date
    return {
      from: subDays(new Date(), 30),
      to: new Date(),
    };
  }, [filters.dateRange.from, filters.dateRange.to]);

  // Destructure filter values for easier access
  const { searchTerm, showComparison, selectedTags, selectedRegions, selectedUtmSources } = filters;

  // Update handlers that persist to database
  const setDateRange = useCallback((range: DateRange | undefined) => {
    updateFilters({
      dateRange: {
        from: range?.from?.toISOString() || null,
        to: range?.to?.toISOString() || null,
      },
    });
  }, [updateFilters]);

  const setSearchTerm = useCallback((value: string) => {
    updateFilters({ searchTerm: value });
  }, [updateFilters]);

  const setShowComparison = useCallback((value: boolean) => {
    updateFilters({ showComparison: value });
  }, [updateFilters]);

  const setSelectedTags = useCallback((value: string[]) => {
    updateFilters({ selectedTags: value });
  }, [updateFilters]);

  const setSelectedRegions = useCallback((value: string[]) => {
    updateFilters({ selectedRegions: value });
  }, [updateFilters]);

  const setSelectedUtmSources = useCallback((value: string[]) => {
    updateFilters({ selectedUtmSources: value });
  }, [updateFilters]);

  const { data, comparisonData, isLoading, lastUpdated, fetchLeads, clearCache } = useLeadsData(dateRange, activeSheetsIntegration?.id);

  // Hook para funil de qualificação - DEVE ser chamado no topo, não no JSX
  const qualificationFunnelData = useQualificationFunnel(data?.kpis || null);

  const handleRefresh = useCallback(() => {
    clearCache();
    fetchLeads(true);
  }, [clearCache, fetchLeads]);

  const handlePullToRefresh = useCallback(async () => {
    handleRefresh();
  }, [handleRefresh]);

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleClearTableFilters = useCallback(() => {
    updateFilters({
      searchTerm: "",
      selectedTags: [],
      selectedRegions: [],
      selectedUtmSources: [],
    });
  }, [updateFilters]);

  // Get unique values for filters
  const uniqueTags = useMemo(() => {
    if (!data?.leads) return [];
    const tags = new Set(data.leads.map(l => l.tag).filter(Boolean));
    return Array.from(tags).sort();
  }, [data?.leads]);

  const uniqueRegions = useMemo(() => {
    if (!data?.leads) return [];
    const regions = new Set(data.leads.map(l => l.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [data?.leads]);

  const uniqueUtmSources = useMemo(() => {
    if (!data?.leads) return [];
    const sources = new Set(data.leads.map(l => l.utmSource).filter(Boolean));
    return Array.from(sources).sort();
  }, [data?.leads]);

  // Filter leads by search term and filters
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];

    return data.leads.filter((lead) => {
      // Search filter
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      // Tag filter
      const matchesTag = selectedTags.length === 0 || selectedTags.includes(lead.tag);

      // Region filter
      const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(lead.region);

      // UTM Source filter
      const matchesUtmSource = selectedUtmSources.length === 0 || selectedUtmSources.includes(lead.utmSource);

      return matchesSearch && matchesTag && matchesRegion && matchesUtmSource;
    });
  }, [data?.leads, searchTerm, selectedTags, selectedRegions, selectedUtmSources]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedTags.length > 0) count++;
    if (selectedRegions.length > 0) count++;
    if (selectedUtmSources.length > 0) count++;
    if (showComparison) count++;
    return count;
  }, [searchTerm, selectedTags, selectedRegions, selectedUtmSources, showComparison]);

  // Format timeline data
  const formattedTimeline = useMemo(() => {
    if (!data?.timeline) return [];
    return data.timeline.map(point => ({
      ...point,
      date: formatTimelineDate(point.date),
    }));
  }, [data?.timeline]);

  // Prepare chart data with colors
  const genderData = useMemo(() =>
    addColorsToData(data?.distributions?.gender || []),
    [data?.distributions?.gender]
  );

  const regionData = useMemo(() =>
    addColorsToData(data?.distributions?.region || []),
    [data?.distributions?.region]
  );

  const ageData = data?.distributions?.age || [];
  const utmSourceData = data?.distributions?.utmSource || [];
  const incomeData = data?.distributions?.income || [];
  const objectionData = data?.distributions?.objection || [];
  const socialNetworkData = data?.distributions?.socialNetwork || [];
  const objectiveData = data?.distributions?.objective || [];
  const calculatedScoringData = useMemo(() => {
    const rawData = data?.distributions?.calculatedScoring || [];
    return rawData.map((item: { name: string; value: number; color?: string }) => ({
      ...item,
      color: item.color || 'hsl(var(--chart-1))'
    }));
  }, [data?.distributions?.calculatedScoring]);
  const experienceData = useMemo(() =>
    addColorsToData(data?.distributions?.experience || []),
    [data?.distributions?.experience]
  );
  const creditLimitData = data?.distributions?.creditLimit || [];
  const followTimeData = data?.distributions?.followTime || [];
  const maritalStatusData = useMemo(() =>
    addColorsToData(data?.distributions?.maritalStatus || []),
    [data?.distributions?.maritalStatus]
  );
  const professionData = data?.distributions?.profession || [];

  // Transform score by source data for StackedBarChart
  const transformScoreData = (sourceData: ScoreBySource[]) => {
    return sourceData.map(item => ({
      name: item.name,
      total: item.total,
      categories: [
        { name: "Alto", value: item.alto, color: SCORE_COLORS.alto },
        { name: "Médio", value: item.medio, color: SCORE_COLORS.medio },
        { name: "Baixo", value: item.baixo, color: SCORE_COLORS.baixo },
        { name: "Desqualificado", value: item.desqualificado, color: SCORE_COLORS.desqualificado },
      ],
    }));
  };

  const scoreByAdSetData = useMemo(() =>
    transformScoreData(data?.distributions?.scoreByAdSet || []),
    [data?.distributions?.scoreByAdSet]
  );

  const scoreByAdData = useMemo(() =>
    transformScoreData(data?.distributions?.scoreByAd || []),
    [data?.distributions?.scoreByAd]
  );

  return (
    <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-background">
        <LoadingProgress
          isLoading={isLoading}
          estimatedTime={5}
          message={`Carregando ${data?.totalCount ? 'mais ' : ''}leads...`}
        />
        <DashboardHeader
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          projectsLoading={projectsLoading}
        />

        {/* Controls Bar - Refresh, DatePicker */}
        <div className="sticky top-16 z-40 w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="w-full px-4 py-3 flex flex-wrap items-center justify-end gap-3">
            {activeFiltersCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Resetar</span>
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0">
                      {activeFiltersCount}
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar todos os filtros ativos</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="gap-2 hover:border-primary/50 hover:bg-primary/5"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  <span className="hidden sm:inline">Atualizar</span>
                  {lastUpdated && (
                    <span className="text-muted-foreground text-xs hidden lg:inline">
                      {formatDistanceToNow(lastUpdated, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar dados do servidor (limpa cache)</p>
              </TooltipContent>
            </Tooltip>

            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        <main className="w-full px-4 py-6 space-y-6">
          {/* No Integration Alert */}
          {!isLoading && activeProject && !activeSheetsIntegration && (
            <NoIntegrationAlert
              projectName={activeProject.name}
              integrationType="Google Sheets"
            />
          )}

          {/* KPI Cards Header */}
          <div className="flex items-center justify-between animate-fade-in">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Métricas de Leads
            </h2>
            <ComparisonToggle
              enabled={showComparison}
              onChange={setShowComparison}
              isLoading={isLoading}
            />
          </div>

          {/* KPI Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Total de Leads"
              value={data?.kpis?.total?.toLocaleString('pt-BR') || '0'}
              change={showComparison && comparisonData?.total !== null ? comparisonData?.total : undefined}
              changeLabel="vs período anterior"
              icon={<Users className="h-4 w-4" />}
              sparklineData={data?.sparklineData}
              loading={isLoading}
              tooltip="Número total de leads captados no período selecionado"
              delay={50}
            />
            <KPICard
              title="Leads Orgânicos"
              value={data?.kpis?.organic?.toLocaleString('pt-BR') || '0'}
              change={showComparison && comparisonData?.organic !== null ? comparisonData?.organic : undefined}
              changeLabel="vs período anterior"
              icon={<TrendingUp className="h-4 w-4" />}
              loading={isLoading}
              tooltip="Leads que chegaram de forma orgânica, sem anúncios pagos"
              delay={100}
            />
            <KPICard
              title="Com Pesquisa"
              value={data?.kpis?.withSurvey?.toLocaleString('pt-BR') || '0'}
              change={showComparison && comparisonData?.withSurvey !== null ? comparisonData?.withSurvey : undefined}
              changeLabel="vs período anterior"
              icon={<ClipboardList className="h-4 w-4" />}
              loading={isLoading}
              tooltip="Leads que responderam à pesquisa de qualificação"
              delay={150}
            />
            <KPICard
              title="Taxa de Pesquisa"
              value={`${data?.kpis?.surveyRate?.toFixed(1) || '0'}%`}
              change={showComparison && comparisonData?.surveyRate !== null ? comparisonData?.surveyRate : undefined}
              changeLabel="vs período anterior"
              icon={<Percent className="h-4 w-4" />}
              loading={isLoading}
              tooltip="Porcentagem de leads que completaram a pesquisa"
              delay={200}
            />
            <KPICard
              title="Score Médio"
              value={data?.kpis?.avgScore?.toString() || '0'}
              icon={<Star className="h-4 w-4" />}
              loading={isLoading}
              tooltip="Pontuação média de qualificação dos leads (0-100)"
              delay={250}
            />
            <KPICard
              title="Hot Leads"
              value={`${data?.kpis?.hotLeadsRate?.toFixed(1) || '0'}%`}
              icon={<Flame className="h-4 w-4" />}
              loading={isLoading}
              tooltip={`${data?.kpis?.hotLeadsCount || 0} leads classificados como "A - Hot Lead"`}
              delay={300}
            />
          </section>


          {/* Section: Origem dos Leads */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "250ms" }}>
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Origem dos Leads</h2>
            </div>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <TimelineAreaChart
                title="Evolução de Cadastros"
                data={formattedTimeline}
                height={250}
                color="hsl(var(--chart-1))"
                loading={isLoading}
                delay={300}
              />
              <DistributionBarChart
                title="Leads por UTM Source"
                data={utmSourceData}
                height={250}
                color="hsl(var(--chart-2))"
                labelWidth={100}
                loading={isLoading}
                delay={350}
              />
            </section>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Section: Funil de Qualificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "275ms" }}>
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Funil de Qualificação</h2>
            </div>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <SalesFunnelChart
                title="Pipeline de Leads"
                icon={<Target className="h-4 w-4 text-primary" />}
                data={qualificationFunnelData}
                height={260}
                showConversionRates
                loading={isLoading}
                delay={300}
              />
              <QualificationMetricsPanel
                totalLeads={data?.kpis?.total || 0}
                withSurvey={data?.kpis?.withSurvey || 0}
                qualified={Math.round((data?.kpis?.hotLeadsCount || 0) * 2)}
                hotLeads={data?.kpis?.hotLeadsCount || 0}
                surveyRate={data?.kpis?.surveyRate || 0}
                qualificationRate={data?.kpis?.withSurvey ? getConversionRate(Math.round((data?.kpis?.hotLeadsCount || 0) * 2), data.kpis.withSurvey) : 0}
                hotLeadRate={data?.kpis?.hotLeadsRate || 0}
                loading={isLoading}
                delay={350}
              />
            </section>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Section: Qualidade por Origem */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Qualidade dos Leads por Origem</h2>
            </div>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <StackedBarChart
                title="Score por Conjunto"
                icon={<BarChart3 className="h-4 w-4 text-primary" />}
                data={scoreByAdSetData}
                height={280}
                loading={isLoading}
                delay={375}
                labelWidth={140}
                maxLabelChars={22}
                maxItems={8}
              />
              <StackedBarChart
                title="Score por Anúncio"
                icon={<BarChart3 className="h-4 w-4 text-primary" />}
                data={scoreByAdData}
                height={280}
                loading={isLoading}
                delay={425}
                labelWidth={140}
                maxLabelChars={22}
                maxItems={8}
              />
            </section>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Section: Análise da Pesquisa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "450ms" }}>
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Análise da Pesquisa</h2>
            </div>

            {/* Subsection: Perfil Demográfico */}
            <div className="p-5 bg-muted/30 rounded-lg border border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-base font-medium">Perfil Demográfico</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
                <DistributionPieChart
                  title="Gênero"
                  data={genderData}
                  height={220}
                  innerRadius={45}
                  outerRadius={70}
                  loading={isLoading}
                  delay={400}
                />
                <DistributionBarChart
                  title="Faixa Etária"
                  data={ageData}
                  height={220}
                  color="hsl(var(--chart-1))"
                  labelWidth={140}
                  labelFontSize={11}
                  maxLabelChars={25}
                  loading={isLoading}
                  delay={450}
                />
                <DistributionPieChart
                  title="Região"
                  data={regionData}
                  height={220}
                  innerRadius={45}
                  outerRadius={70}
                  loading={isLoading}
                  delay={500}
                />
                <DistributionPieChart
                  title="Estado Civil"
                  data={maritalStatusData}
                  height={220}
                  innerRadius={45}
                  outerRadius={70}
                  loading={isLoading}
                  delay={550}
                />
                <DistributionBarChart
                  title="Profissão"
                  data={professionData}
                  height={220}
                  color="hsl(var(--chart-4))"
                  labelWidth={160}
                  labelFontSize={11}
                  maxLabelChars={25}
                  loading={isLoading}
                  delay={600}
                />
              </div>
            </div>

            {/* Subsection: Perfil Financeiro */}
            <div className="p-5 bg-muted/30 rounded-lg border border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h4 className="text-base font-medium">Perfil Financeiro</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <DistributionBarChart
                  title="Distribuição por Renda"
                  data={incomeData}
                  height={220}
                  color="hsl(var(--chart-3))"
                  labelWidth={180}
                  labelFontSize={11}
                  maxLabelChars={28}
                  loading={isLoading}
                  delay={650}
                />
                <DistributionBarChart
                  title="Limite de Crédito"
                  data={creditLimitData}
                  height={220}
                  color="hsl(var(--chart-2))"
                  labelWidth={180}
                  labelFontSize={11}
                  maxLabelChars={28}
                  loading={isLoading}
                  delay={700}
                />
              </div>
            </div>

            {/* Subsection: Engajamento & Comportamento */}
            <div className="p-5 bg-muted/30 rounded-lg border border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h4 className="text-base font-medium">Engajamento & Comportamento</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 items-stretch">
                <DistributionBarChart
                  title="Rede Social"
                  data={socialNetworkData}
                  height={220}
                  color="hsl(var(--chart-4))"
                  labelWidth={140}
                  labelFontSize={11}
                  maxLabelChars={25}
                  loading={isLoading}
                  delay={750}
                />
                <DistributionPieChart
                  title="Experiência"
                  data={experienceData}
                  height={220}
                  innerRadius={45}
                  outerRadius={70}
                  loading={isLoading}
                  delay={800}
                />
                <DistributionBarChart
                  title="Objetivo"
                  data={objectiveData}
                  height={220}
                  color="hsl(var(--chart-3))"
                  labelWidth={140}
                  labelFontSize={11}
                  maxLabelChars={25}
                  loading={isLoading}
                  delay={850}
                />
                <DistributionPieChart
                  title="Score Calculado"
                  data={calculatedScoringData}
                  height={220}
                  innerRadius={45}
                  outerRadius={70}
                  loading={isLoading}
                  delay={850}
                />
                <DistributionBarChart
                  title="Tempo Acompanhando"
                  data={followTimeData}
                  height={220}
                  color="hsl(var(--chart-3))"
                  labelWidth={160}
                  labelFontSize={11}
                  maxLabelChars={25}
                  loading={isLoading}
                  delay={900}
                />
                <DistributionBarChart
                  title="Principal Objeção"
                  data={objectionData}
                  height={220}
                  color="hsl(var(--chart-5))"
                  labelWidth={180}
                  labelFontSize={11}
                  maxLabelChars={28}
                  loading={isLoading}
                  delay={950}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Leads Table */}
          <section className="animate-fade-in" style={{ animationDelay: "850ms" }}>
            <LeadsTable
              leads={filteredLeads}
              totalCount={data?.totalCount}
              loading={isLoading}
              searchQuery={searchTerm}
              onSearchChange={setSearchTerm}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              selectedRegions={selectedRegions}
              onRegionsChange={setSelectedRegions}
              selectedUtmSources={selectedUtmSources}
              onUtmSourcesChange={setSelectedUtmSources}
              uniqueTags={uniqueTags}
              uniqueRegions={uniqueRegions}
              uniqueUtmSources={uniqueUtmSources}
              onClearFilters={handleClearTableFilters}
            />
          </section>
        </main>
      </div>
    </PullToRefresh>
  );
}
