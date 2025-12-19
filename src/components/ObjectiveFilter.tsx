import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataSources } from "@/components/DataSourceSelector";

// Meta Ads objectives
export type MetaObjective = 
  | "OUTCOME_LEADS" 
  | "OUTCOME_TRAFFIC" 
  | "OUTCOME_AWARENESS" 
  | "OUTCOME_ENGAGEMENT" 
  | "OUTCOME_SALES" 
  | "OUTCOME_APP_PROMOTION";

// Google Ads campaign types
export type GoogleObjective =
  | "SEARCH"
  | "DISPLAY"
  | "VIDEO"
  | "SHOPPING"
  | "PERFORMANCE_MAX"
  | "DISCOVERY"
  | "LOCAL"
  | "SMART";

export type CampaignObjective = MetaObjective | GoogleObjective;

interface ObjectiveFilterProps {
  selectedObjectives: CampaignObjective[];
  onChange: (objectives: CampaignObjective[]) => void;
  dataSources?: DataSources;
}

interface ObjectiveConfig {
  label: string;
  colorClass: string;
  platform: "meta" | "google";
}

export const objectiveConfig: Record<CampaignObjective, ObjectiveConfig> = {
  // Meta Ads objectives - with light/dark theme support
  OUTCOME_LEADS: { label: "Leads", colorClass: "text-purple-600 dark:text-purple-400", platform: "meta" },
  OUTCOME_TRAFFIC: { label: "Tráfego", colorClass: "text-blue-600 dark:text-blue-400", platform: "meta" },
  OUTCOME_AWARENESS: { label: "Reconhecimento", colorClass: "text-cyan-600 dark:text-cyan-400", platform: "meta" },
  OUTCOME_ENGAGEMENT: { label: "Engajamento", colorClass: "text-pink-600 dark:text-pink-400", platform: "meta" },
  OUTCOME_SALES: { label: "Vendas", colorClass: "text-green-600 dark:text-green-400", platform: "meta" },
  OUTCOME_APP_PROMOTION: { label: "Apps", colorClass: "text-orange-600 dark:text-orange-400", platform: "meta" },
  // Google Ads campaign types - with light/dark theme support
  SEARCH: { label: "Pesquisa", colorClass: "text-blue-700 dark:text-blue-500", platform: "google" },
  DISPLAY: { label: "Display", colorClass: "text-green-700 dark:text-green-500", platform: "google" },
  VIDEO: { label: "Vídeo", colorClass: "text-red-700 dark:text-red-500", platform: "google" },
  SHOPPING: { label: "Shopping", colorClass: "text-amber-700 dark:text-amber-500", platform: "google" },
  PERFORMANCE_MAX: { label: "Performance Max", colorClass: "text-indigo-700 dark:text-indigo-500", platform: "google" },
  DISCOVERY: { label: "Discovery", colorClass: "text-teal-700 dark:text-teal-500", platform: "google" },
  LOCAL: { label: "Local", colorClass: "text-rose-700 dark:text-rose-500", platform: "google" },
  SMART: { label: "Smart", colorClass: "text-violet-700 dark:text-violet-500", platform: "google" },
};

const metaObjectives: MetaObjective[] = [
  "OUTCOME_LEADS",
  "OUTCOME_TRAFFIC", 
  "OUTCOME_AWARENESS",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_SALES",
  "OUTCOME_APP_PROMOTION",
];

const googleObjectives: GoogleObjective[] = [
  "SEARCH",
  "DISPLAY",
  "VIDEO",
  "SHOPPING",
  "PERFORMANCE_MAX",
  "DISCOVERY",
  "LOCAL",
  "SMART",
];

export const allObjectives: CampaignObjective[] = [...metaObjectives, ...googleObjectives];

export function ObjectiveFilter({ selectedObjectives, onChange, dataSources = ["meta"] }: ObjectiveFilterProps) {
  const hasMeta = dataSources.includes("meta");
  const hasGoogle = dataSources.includes("google");
  
  // Get visible objectives based on selected data sources
  const visibleObjectives: CampaignObjective[] = [
    ...(hasMeta ? metaObjectives : []),
    ...(hasGoogle ? googleObjectives : []),
  ];

  const toggleObjective = (objective: CampaignObjective) => {
    if (selectedObjectives.includes(objective)) {
      onChange(selectedObjectives.filter((o) => o !== objective));
    } else {
      onChange([...selectedObjectives, objective]);
    }
  };

  const selectAll = () => {
    const newObjectives = [...new Set([...selectedObjectives, ...visibleObjectives])];
    onChange(newObjectives);
  };

  const clearAll = () => {
    onChange(selectedObjectives.filter(o => !visibleObjectives.includes(o)));
  };

  const visibleSelected = selectedObjectives.filter(o => visibleObjectives.includes(o));

  const getButtonLabel = () => {
    if (visibleSelected.length === 0) return "Nenhum";
    if (visibleSelected.length === visibleObjectives.length) return "Todos";
    return `${visibleSelected.length} selecionados`;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Objetivo:</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            {getButtonLabel()}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2 bg-popover border-border" align="start">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs gap-1"
              onClick={selectAll}
              disabled={visibleSelected.length === visibleObjectives.length}
            >
              <Check className="h-3 w-3" />
              Todos
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs gap-1 text-muted-foreground"
              onClick={clearAll}
              disabled={visibleSelected.length === 0}
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {/* Meta Ads Section */}
            {hasMeta && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meta Ads
                </div>
                {metaObjectives.map((objective) => {
                  const config = objectiveConfig[objective];
                  const isSelected = selectedObjectives.includes(objective);
                  
                  return (
                    <label
                      key={objective}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleObjective(objective)}
                      />
                      <span className={cn("text-sm", config.colorClass)}>
                        {config.label}
                      </span>
                    </label>
                  );
                })}
              </>
            )}
            
            {/* Google Ads Section */}
            {hasGoogle && (
              <>
                <div className={cn("px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider", hasMeta && "mt-2 border-t border-border pt-2")}>
                  Google Ads
                </div>
                {googleObjectives.map((objective) => {
                  const config = objectiveConfig[objective];
                  const isSelected = selectedObjectives.includes(objective);
                  
                  return (
                    <label
                      key={objective}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleObjective(objective)}
                      />
                      <span className={cn("text-sm", config.colorClass)}>
                        {config.label}
                      </span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
