import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/SearchInput";
import { StatusFilter, CampaignStatus } from "@/components/StatusFilter";
import { ObjectiveFilter, CampaignObjective, objectiveConfig } from "@/components/ObjectiveFilter";
import { ExportButton } from "@/components/ExportButton";
import { DataSources } from "@/components/DataSourceSelector";
import { FacebookIcon, GoogleIcon } from "@/components/DataSourceBadge";


interface Ad {
  id: string;
  name: string;
  status: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  sales: number;
  cps: number;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  sales: number;
  cps: number;
  ads: Ad[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  sales: number;
  cps: number;
  adsets: AdSet[];
}

interface AdsTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: CampaignStatus[];
  onStatusChange: (statuses: CampaignStatus[]) => void;
  selectedObjectives: CampaignObjective[];
  onObjectiveChange: (objectives: CampaignObjective[]) => void;
  onClearFilters?: () => void;
  dataSources?: DataSources;
}

// Status visual config matching StatusFilter colors - with light/dark theme support
const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { 
    label: "Ativa", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" 
  },
  PAUSED: { 
    label: "Pausada", 
    className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" 
  },
  CAMPAIGN_PAUSED: { 
    label: "Campanha Pausada", 
    className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30" 
  },
  IN_PROCESS: { 
    label: "Em Análise", 
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" 
  },
  WITH_ISSUES: { 
    label: "Com Problemas", 
    className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30" 
  },
  ARCHIVED: { 
    label: "Arquivada", 
    className: "bg-slate-200/60 text-slate-600 border-slate-300 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30" 
  },
  DELETED: { 
    label: "Excluída", 
    className: "bg-gray-200/60 text-gray-600 border-gray-300 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30" 
  },
};

const getStatusDisplay = (status: string) => {
  const config = statusConfig[status];
  return config || { label: status, className: "bg-muted text-muted-foreground border-border" };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

type SortKey = 'name' | 'status' | 'objective' | 'impressions' | 'reach' | 'clicks' | 'ctr' | 'spend' | 'cpc' | 'cpm' | 'leads' | 'cpl' | 'sales' | 'cps';
type SortDirection = 'asc' | 'desc';

const getObjectiveDisplay = (objective: string) => {
  const config = objectiveConfig[objective as CampaignObjective];
  if (!config) return { label: objective, platform: null, className: "bg-muted text-muted-foreground border-0" };
  return { 
    label: config.label, 
    platform: config.platform,
    className: config.platform === "meta" 
      ? "bg-[hsl(221,70%,50%)] text-white border-0" 
      : "bg-[hsl(12,80%,55%)] text-white border-0"
  };
};

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const SORTABLE_COLUMNS: { key: SortKey; label: string; align?: 'left' | 'right' }[] = [
  { key: 'name', label: 'Nome', align: 'left' },
  { key: 'status', label: 'Status', align: 'left' },
  { key: 'objective', label: 'Objetivo', align: 'left' },
  { key: 'impressions', label: 'Impressões', align: 'right' },
  { key: 'reach', label: 'Alcance', align: 'right' },
  { key: 'clicks', label: 'Cliques', align: 'right' },
  { key: 'ctr', label: 'CTR', align: 'right' },
  { key: 'leads', label: 'Leads', align: 'right' },
  { key: 'cpl', label: 'CPL', align: 'right' },
  { key: 'sales', label: 'Vendas', align: 'right' },
  { key: 'cps', label: 'CPS', align: 'right' },
  { key: 'spend', label: 'Gasto', align: 'right' },
  { key: 'cpc', label: 'CPC', align: 'right' },
  { key: 'cpm', label: 'CPM', align: 'right' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function AdsTable({ 
  campaigns, 
  loading = false,
  searchQuery,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  selectedObjectives,
  onObjectiveChange,
  onClearFilters,
  dataSources = ["meta"],
}: AdsTableProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Reset to page 1 when campaigns change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedCampaigns(new Set());
    setExpandedAdsets(new Set());
  }, [campaigns.length]);

  const totalCampaigns = campaigns.length;
  const totalPages = Math.ceil(totalCampaigns / itemsPerPage);

  // Generic sort function for sortable items
  const sortItems = <T extends Record<string, unknown>>(items: T[]): T[] => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'pt-BR');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  // Sort campaigns with nested adsets and ads
  const sortedCampaigns = useMemo((): Campaign[] => {
    const sorted = sortItems(campaigns as unknown as Record<string, unknown>[]) as unknown as Campaign[];
    
    return sorted.map(campaign => ({
      ...campaign,
      adsets: (sortItems(campaign.adsets as unknown as Record<string, unknown>[]) as unknown as AdSet[]).map(adset => ({
        ...adset,
        ads: sortItems(adset.ads as unknown as Record<string, unknown>[]) as unknown as Ad[],
      })),
    }));
  }, [campaigns, sortConfig]);

  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCampaigns.slice(startIndex, endIndex);
  }, [sortedCampaigns, currentPage, itemsPerPage]);

  // Flatten campaigns data for export - MUST be before early return to maintain hooks order
  const exportData = useMemo(() => {
    return campaigns.flatMap(campaign => 
      campaign.adsets.flatMap(adset => 
        adset.ads.map(ad => ({
          campanha: campaign.name,
          status_campanha: getStatusDisplay(campaign.status).label,
          objetivo: campaign.objective,
          conjunto: adset.name,
          status_conjunto: getStatusDisplay(adset.status).label,
          anuncio: ad.name,
          status_anuncio: getStatusDisplay(ad.status).label,
          impressoes: ad.impressions,
          alcance: ad.reach,
          cliques: ad.clicks,
          ctr: ad.ctr,
          leads: ad.leads,
          cpl: ad.cpl,
          vendas: ad.sales || 0,
          cps: ad.cps || 0,
          gasto: ad.spend,
          cpc: ad.cpc,
          cpm: ad.cpm,
        }))
      )
    );
  }, [campaigns]);

  const exportColumns = [
    { key: 'campanha' as const, label: 'Campanha' },
    { key: 'status_campanha' as const, label: 'Status Campanha' },
    { key: 'objetivo' as const, label: 'Objetivo' },
    { key: 'conjunto' as const, label: 'Conjunto' },
    { key: 'status_conjunto' as const, label: 'Status Conjunto' },
    { key: 'anuncio' as const, label: 'Anúncio' },
    { key: 'status_anuncio' as const, label: 'Status Anúncio' },
    { key: 'impressoes' as const, label: 'Impressões' },
    { key: 'alcance' as const, label: 'Alcance' },
    { key: 'cliques' as const, label: 'Cliques' },
    { key: 'ctr' as const, label: 'CTR (%)' },
    { key: 'leads' as const, label: 'Leads' },
    { key: 'cpl' as const, label: 'CPL (R$)' },
    { key: 'vendas' as const, label: 'Vendas' },
    { key: 'cps' as const, label: 'CPS (R$)' },
    { key: 'gasto' as const, label: 'Gasto (R$)' },
    { key: 'cpc' as const, label: 'CPC (R$)' },
    { key: 'cpm' as const, label: 'CPM (R$)' },
  ];

  const startItem = totalCampaigns === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCampaigns);

  const toggleCampaign = (id: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCampaigns(newExpanded);
  };

  const toggleAdset = (id: string) => {
    const newExpanded = new Set(expandedAdsets);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAdsets(newExpanded);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCampaigns(new Set());
    setExpandedAdsets(new Set());
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setExpandedCampaigns(new Set());
    setExpandedAdsets(new Set());
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'desc') {
          return { key, direction: 'asc' };
        }
        return null; // Remove sort
      }
      return { key, direction: 'desc' };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1" />;
    }
    return <ArrowUp className="h-3 w-3 ml-1" />;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (loading) {
  return (
    <Card variant="glass">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Campanhas</CardTitle>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {totalCampaigns} campanhas
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Buscar campanha, adset ou anúncio..."
            />
            <div className="flex flex-wrap items-center gap-4">
              <StatusFilter 
                selectedStatuses={selectedStatuses} 
                onChange={onStatusChange} 
              />
              <ObjectiveFilter
                selectedObjectives={selectedObjectives}
                onChange={onObjectiveChange}
                dataSources={dataSources}
              />
              {onClearFilters && (searchQuery || selectedStatuses.length < 2 || selectedObjectives.length < 6) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex gap-4 p-3 bg-muted/20 rounded-lg">
              <Skeleton variant="glass" className="h-5 w-48" />
              <Skeleton variant="glass" className="h-5 w-16" />
              <Skeleton variant="glass" className="h-5 w-20 ml-auto" />
              <Skeleton variant="glass" className="h-5 w-16" />
              <Skeleton variant="glass" className="h-5 w-16" />
              <Skeleton variant="glass" className="h-5 w-20" />
            </div>
            {/* Row skeletons */}
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="flex gap-4 p-3 rounded-lg"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Skeleton variant="glass" className="h-5 w-48" style={{ animationDelay: `${i * 50}ms` }} />
                <Skeleton variant="glass" className="h-5 w-16 rounded-full" style={{ animationDelay: `${i * 50 + 25}ms` }} />
                <Skeleton variant="glass" className="h-5 w-20 ml-auto" style={{ animationDelay: `${i * 50 + 50}ms` }} />
                <Skeleton variant="glass" className="h-5 w-16" style={{ animationDelay: `${i * 50 + 75}ms` }} />
                <Skeleton variant="glass" className="h-5 w-16" style={{ animationDelay: `${i * 50 + 100}ms` }} />
                <Skeleton variant="glass" className="h-5 w-20" style={{ animationDelay: `${i * 50 + 125}ms` }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Campanhas</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalCampaigns} {totalCampaigns === 1 ? 'campanha' : 'campanhas'}
              </span>
              <ExportButton
                data={exportData}
                columns={exportColumns}
                filename={`campanhas-${new Date().toISOString().split('T')[0]}`}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Buscar campanha, adset ou anúncio..."
            />
            <div className="flex flex-wrap items-center gap-4">
              <StatusFilter selectedStatuses={selectedStatuses} onChange={onStatusChange} />
              <ObjectiveFilter
                selectedObjectives={selectedObjectives}
                onChange={onObjectiveChange}
                dataSources={dataSources}
              />
              {onClearFilters && (searchQuery || selectedStatuses.length < 2 || selectedObjectives.length < 6) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/30">
                {SORTABLE_COLUMNS.map((column, index) => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      "cursor-pointer select-none hover:bg-muted/50 transition-colors font-semibold text-foreground/80",
                      index === 0 && "w-[300px]",
                      column.align === 'right' && "text-right"
                    )}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      column.align === 'right' && "justify-end"
                    )}>
                      {column.label}
                      {getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    Nenhuma campanha encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCampaigns.map((campaign) => (
                  <>
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer hover:bg-primary/5 font-medium transition-colors border-b border-border/30"
                      onClick={() => toggleCampaign(campaign.id)}
                    >
                      <TableCell className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          {expandedCampaigns.has(campaign.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs rounded-full px-1.5 py-0 h-5 shrink-0",
                            getObjectiveDisplay(campaign.objective).platform === "meta" 
                              ? "bg-[hsl(221,70%,50%)] text-white border-0" 
                              : "bg-[hsl(12,80%,55%)] text-white border-0"
                          )}
                        >
                          {getObjectiveDisplay(campaign.objective).platform === "meta" ? (
                            <FacebookIcon className="w-3 h-3" />
                          ) : (
                            <GoogleIcon className="w-3 h-3 [&_path]:fill-white" />
                          )}
                        </Badge>
                        <span className="truncate max-w-[220px]">{campaign.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs border", getStatusDisplay(campaign.status).className)}>
                          {getStatusDisplay(campaign.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs rounded-full px-2 py-0.5", getObjectiveDisplay(campaign.objective).className)}>
                          <span className="flex items-center gap-1">
                            {getObjectiveDisplay(campaign.objective).platform === "meta" && (
                              <FacebookIcon className="w-3 h-3" />
                            )}
                            {getObjectiveDisplay(campaign.objective).platform === "google" && (
                              <GoogleIcon className="w-3 h-3 [&_path]:fill-white" />
                            )}
                            {getObjectiveDisplay(campaign.objective).label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.impressions || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.reach || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.clicks || 0)}</TableCell>
                      <TableCell className="text-right">{formatPercent(campaign.ctr || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.leads || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpl || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.sales || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cps || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.spend || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpc || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpm || 0)}</TableCell>
                    </TableRow>

                    {expandedCampaigns.has(campaign.id) &&
                      campaign.adsets.map((adset) => (
                        <>
                          <TableRow
                            key={adset.id}
                            className="cursor-pointer hover:bg-primary/5 bg-muted/20 transition-colors border-b border-border/20"
                            onClick={() => toggleAdset(adset.id)}
                          >
                            <TableCell className="flex items-center gap-2 pl-8">
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                {expandedAdsets.has(adset.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="truncate max-w-[220px]">{adset.name}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs border", getStatusDisplay(adset.status).className)}>
                                {getStatusDisplay(adset.status).label}
                              </Badge>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right">{formatNumber(adset.impressions || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(adset.reach || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(adset.clicks || 0)}</TableCell>
                            <TableCell className="text-right">{formatPercent(adset.ctr || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(adset.leads || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(adset.cpl || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(adset.sales || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(adset.cps || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(adset.spend || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(adset.cpc || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(adset.cpm || 0)}</TableCell>
                          </TableRow>

                          {expandedAdsets.has(adset.id) &&
                            adset.ads.map((ad) => (
                              <TableRow key={ad.id} className="bg-muted/10 hover:bg-primary/5 transition-colors border-b border-border/10">
                                <TableCell className="pl-16">
                                  <span className="truncate max-w-[200px] block">{ad.name}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cn("text-xs border", getStatusDisplay(ad.status).className)}>
                                    {getStatusDisplay(ad.status).label}
                                  </Badge>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right">{formatNumber(ad.impressions || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(ad.reach || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(ad.clicks || 0)}</TableCell>
                                <TableCell className="text-right">{formatPercent(ad.ctr || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(ad.leads || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(ad.cpl || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(ad.sales || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(ad.cps || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(ad.spend || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(ad.cpc || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(ad.cpm || 0)}</TableCell>
                              </TableRow>
                            ))}
                        </>
                      ))}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalCampaigns > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Mostrando {startItem}-{endItem} de {totalCampaigns} campanhas
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Por página:</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  <span className="hidden sm:inline mr-1">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
