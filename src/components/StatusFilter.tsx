import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CampaignStatus = 
  | "ACTIVE" 
  | "PAUSED" 
  | "ARCHIVED" 
  | "IN_PROCESS" 
  | "WITH_ISSUES" 
  | "CAMPAIGN_PAUSED"
  | "DELETED";

interface StatusFilterProps {
  selectedStatuses: CampaignStatus[];
  onChange: (statuses: CampaignStatus[]) => void;
}

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  ACTIVE: { 
    label: "Ativa", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/30" 
  },
  PAUSED: { 
    label: "Pausada", 
    className: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/30" 
  },
  CAMPAIGN_PAUSED: { 
    label: "Campanha Pausada", 
    className: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 dark:hover:bg-orange-500/30" 
  },
  IN_PROCESS: { 
    label: "Em Análise", 
    className: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/30" 
  },
  WITH_ISSUES: { 
    label: "Com Problemas", 
    className: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/30" 
  },
  ARCHIVED: { 
    label: "Arquivada", 
    className: "bg-slate-200/60 text-slate-600 border-slate-300 hover:bg-slate-200/80 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30 dark:hover:bg-slate-500/30" 
  },
  DELETED: { 
    label: "Excluída", 
    className: "bg-gray-200/60 text-gray-600 border-gray-300 hover:bg-gray-200/80 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30 dark:hover:bg-gray-500/30" 
  },
};

// Status principais exibidos no filtro (exclui DELETED que geralmente não é relevante)
const displayStatuses: CampaignStatus[] = [
  "ACTIVE", 
  "PAUSED", 
  "CAMPAIGN_PAUSED", 
  "IN_PROCESS", 
  "WITH_ISSUES", 
  "ARCHIVED"
];

export function StatusFilter({ selectedStatuses, onChange }: StatusFilterProps) {
  const toggleStatus = (status: CampaignStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status:</span>
      <div className="flex gap-1.5 flex-wrap">
        {displayStatuses.map((status) => {
          const config = statusConfig[status];
          const isSelected = selectedStatuses.includes(status);
          
          return (
            <Badge
              key={status}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all border",
                isSelected ? config.className : "bg-transparent text-muted-foreground border-border opacity-50 hover:opacity-100"
              )}
              onClick={() => toggleStatus(status)}
            >
              {config.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

// Exporta as configurações para uso em outros componentes (ex: AdsTable)
export { statusConfig };
