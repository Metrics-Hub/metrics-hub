import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X, Filter } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  region: string;
  tag: string;
  utmSource: string;
  createdAt: string;
}

interface LeadsTableProps {
  leads: Lead[];
  totalCount?: number;
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  selectedUtmSources: string[];
  onUtmSourcesChange: (sources: string[]) => void;
  uniqueTags: string[];
  uniqueRegions: string[];
  uniqueUtmSources: string[];
  onClearFilters?: () => void;
}

const tagColors: Record<string, string> = {
  "Novo": "bg-chart-1 text-primary-foreground",
  "Qualificado": "bg-success text-success-foreground",
  "Em contato": "bg-warning text-warning-foreground",
  "Hot": "bg-destructive text-destructive-foreground",
  "Frio": "bg-muted text-muted-foreground",
};

type SortKey = 'name' | 'email' | 'phone' | 'region' | 'tag' | 'utmSource' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'WhatsApp' },
  { key: 'region', label: 'Região' },
  { key: 'tag', label: 'Tag' },
  { key: 'utmSource', label: 'UTM Source' },
  { key: 'createdAt', label: 'Data Cadastro' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function LeadsTable({
  leads,
  totalCount,
  loading = false,
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  selectedRegions,
  onRegionsChange,
  selectedUtmSources,
  onUtmSourcesChange,
  uniqueTags,
  uniqueRegions,
  uniqueUtmSources,
  onClearFilters,
}: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Reset to page 1 when leads change
  useEffect(() => {
    setCurrentPage(1);
  }, [leads.length, searchQuery, selectedTags.length, selectedRegions.length, selectedUtmSources.length]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    if (!sortConfig) return leads;

    return [...leads].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      const comparison = String(aValue).localeCompare(String(bValue), 'pt-BR');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [leads, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLeads, currentPage, itemsPerPage]);

  // Export data - MUST be before early return to maintain hooks order
  const exportData = useMemo(() => {
    return sortedLeads.map(lead => ({
      nome: lead.name,
      email: lead.email,
      whatsapp: lead.phone,
      regiao: lead.region || '',
      tag: lead.tag,
      utm_source: lead.utmSource,
      data_cadastro: lead.createdAt,
    }));
  }, [sortedLeads]);

  const exportColumns = [
    { key: 'nome' as const, label: 'Nome' },
    { key: 'email' as const, label: 'Email' },
    { key: 'whatsapp' as const, label: 'WhatsApp' },
    { key: 'regiao' as const, label: 'Região' },
    { key: 'tag' as const, label: 'Tag' },
    { key: 'utm_source' as const, label: 'UTM Source' },
    { key: 'data_cadastro' as const, label: 'Data Cadastro' },
  ];

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'desc') {
          return { key, direction: 'asc' };
        }
        return null;
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

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (selectedTags.length > 0 ? 1 : 0) + 
    (selectedRegions.length > 0 ? 1 : 0) + 
    (selectedUtmSources.length > 0 ? 1 : 0);

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Leads Recentes</CardTitle>
              <Skeleton variant="glass" className="h-5 w-24" />
            </div>
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Buscar por nome, email ou telefone..."
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-4 p-3 bg-muted/20 rounded-lg">
              {SORTABLE_COLUMNS.map((_, i) => (
                <Skeleton key={i} variant="glass" className="h-5 w-20" />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="flex gap-4 p-3 rounded-lg"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {SORTABLE_COLUMNS.map((_, j) => (
                  <Skeleton 
                    key={j} 
                    variant="glass" 
                    className="h-5 w-20" 
                    style={{ animationDelay: `${i * 50 + j * 25}ms` }} 
                  />
                ))}
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Leads Recentes</CardTitle>
              {totalCount !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {leads.length.toLocaleString('pt-BR')} de {totalCount.toLocaleString('pt-BR')}
                </Badge>
              )}
            </div>
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename={`leads-${new Date().toISOString().split('T')[0]}`}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-3">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Buscar por nome, email ou telefone..."
            />
            <div className="flex flex-wrap items-center gap-2">
              {/* Tag Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Tag
                    {selectedTags.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {selectedTags.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filtrar por Tag</span>
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onTagsChange([])}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {uniqueTags.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onTagsChange([...selectedTags, tag]);
                              } else {
                                onTagsChange(selectedTags.filter(t => t !== tag));
                              }
                            }}
                          />
                          <span className="text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Region Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Região
                    {selectedRegions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {selectedRegions.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filtrar por Região</span>
                      {selectedRegions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onRegionsChange([])}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {uniqueRegions.map((region) => (
                        <label
                          key={region}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedRegions.includes(region)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onRegionsChange([...selectedRegions, region]);
                              } else {
                                onRegionsChange(selectedRegions.filter(r => r !== region));
                              }
                            }}
                          />
                          <span className="text-sm">{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* UTM Source Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    UTM Source
                    {selectedUtmSources.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {selectedUtmSources.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filtrar por UTM Source</span>
                      {selectedUtmSources.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onUtmSourcesChange([])}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {uniqueUtmSources.map((source) => (
                        <label
                          key={source}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedUtmSources.includes(source)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onUtmSourcesChange([...selectedUtmSources, source]);
                              } else {
                                onUtmSourcesChange(selectedUtmSources.filter(s => s !== source));
                              }
                            }}
                          />
                          <span className="text-sm truncate">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear All Filters */}
              {onClearFilters && activeFiltersCount > 0 && (
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
                {SORTABLE_COLUMNS.map((column) => (
                  <TableHead
                    key={column.key}
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors font-semibold text-foreground/80"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeads.map((lead) => (
                  <TableRow key={lead.id} className="table-row-interactive border-b border-border/30">
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.region || '-'}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", tagColors[lead.tag] || "bg-muted text-muted-foreground")}>
                        {lead.tag}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.utmSource}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.createdAt}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {sortedLeads.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibindo</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>de {sortedLeads.length.toLocaleString('pt-BR')} leads</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
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