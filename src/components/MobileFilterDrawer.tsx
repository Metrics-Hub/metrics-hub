import { useState } from "react";
import { Filter, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CampaignStatus, statusConfig } from "@/components/StatusFilter";
import { CampaignObjective, allObjectives } from "@/components/ObjectiveFilter";
import { DataSources } from "@/components/DataSourceSelector";

interface MobileFilterDrawerProps {
  // Status filter
  selectedStatuses: CampaignStatus[];
  onStatusChange: (statuses: CampaignStatus[]) => void;
  // Objective filter  
  selectedObjectives: CampaignObjective[];
  onObjectiveChange: (objectives: CampaignObjective[]) => void;
  // Reset
  onReset: () => void;
  // Active count
  activeFiltersCount: number;
  // Data sources
  dataSources?: DataSources;
}

const displayStatuses: CampaignStatus[] = [
  "ACTIVE", 
  "PAUSED", 
  "CAMPAIGN_PAUSED", 
  "IN_PROCESS", 
  "WITH_ISSUES", 
  "ARCHIVED"
];

const objectiveConfig: Record<CampaignObjective, { label: string; colorClass: string }> = {
  // Meta Ads objectives
  OUTCOME_LEADS: { label: "Leads", colorClass: "text-purple-400" },
  OUTCOME_TRAFFIC: { label: "Tráfego", colorClass: "text-blue-400" },
  OUTCOME_AWARENESS: { label: "Reconhecimento", colorClass: "text-cyan-400" },
  OUTCOME_ENGAGEMENT: { label: "Engajamento", colorClass: "text-pink-400" },
  OUTCOME_SALES: { label: "Vendas", colorClass: "text-green-400" },
  OUTCOME_APP_PROMOTION: { label: "Apps", colorClass: "text-orange-400" },
  // Google Ads campaign types
  SEARCH: { label: "Pesquisa", colorClass: "text-blue-500" },
  DISPLAY: { label: "Display", colorClass: "text-green-500" },
  VIDEO: { label: "Vídeo", colorClass: "text-red-500" },
  SHOPPING: { label: "Shopping", colorClass: "text-amber-500" },
  PERFORMANCE_MAX: { label: "Performance Max", colorClass: "text-indigo-500" },
  DISCOVERY: { label: "Discovery", colorClass: "text-teal-500" },
  LOCAL: { label: "Local", colorClass: "text-rose-500" },
  SMART: { label: "Smart", colorClass: "text-violet-500" },
};

const metaObjectives: CampaignObjective[] = [
  "OUTCOME_LEADS",
  "OUTCOME_TRAFFIC", 
  "OUTCOME_AWARENESS",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_SALES",
  "OUTCOME_APP_PROMOTION",
];

const googleObjectives: CampaignObjective[] = [
  "SEARCH",
  "DISPLAY",
  "VIDEO",
  "SHOPPING",
  "PERFORMANCE_MAX",
  "DISCOVERY",
  "LOCAL",
  "SMART",
];

export function MobileFilterDrawer({
  selectedStatuses,
  onStatusChange,
  selectedObjectives,
  onObjectiveChange,
  onReset,
  activeFiltersCount,
  dataSources = ["meta"],
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStatuses, setTempStatuses] = useState(selectedStatuses);
  const [tempObjectives, setTempObjectives] = useState(selectedObjectives);

  const hasMeta = dataSources.includes("meta");
  const hasGoogle = dataSources.includes("google");
  
  // Get visible objectives based on data sources
  const visibleObjectives: CampaignObjective[] = [
    ...(hasMeta ? metaObjectives : []),
    ...(hasGoogle ? googleObjectives : []),
  ];

  const handleOpen = () => {
    setTempStatuses(selectedStatuses);
    setTempObjectives(selectedObjectives);
    setIsOpen(true);
  };

  const handleApply = () => {
    onStatusChange(tempStatuses);
    onObjectiveChange(tempObjectives);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStatuses(displayStatuses);
    setTempObjectives(visibleObjectives);
  };

  const toggleStatus = (status: CampaignStatus) => {
    setTempStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleObjective = (objective: CampaignObjective) => {
    setTempObjectives(prev =>
      prev.includes(objective)
        ? prev.filter(o => o !== objective)
        : [...prev, objective]
    );
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleOpen}
        className="gap-2 h-9"
      >
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary/10 text-primary">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <span>Filtros</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6 overflow-auto">
            {/* Status Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Status</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setTempStatuses(displayStatuses)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {displayStatuses.map((status) => {
                  const config = statusConfig[status];
                  const isSelected = tempStatuses.includes(status);
                  
                  return (
                    <label
                      key={status}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary/50 bg-primary/5" 
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <span className="text-sm">{config.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Objective Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Objetivo</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setTempObjectives(visibleObjectives)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
              </div>
              
              {/* Meta Ads Objectives */}
              {hasMeta && (
                <>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                    Meta Ads
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {metaObjectives.map((objective) => {
                      const config = objectiveConfig[objective];
                      const isSelected = tempObjectives.includes(objective);
                      
                      return (
                        <label
                          key={objective}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected 
                              ? "border-primary/50 bg-primary/5" 
                              : "border-border bg-card hover:bg-accent"
                          )}
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
                  </div>
                </>
              )}
              
              {/* Google Ads Objectives */}
              {hasGoogle && (
                <>
                  <div className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider px-1", hasMeta && "mt-3")}>
                    Google Ads
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {googleObjectives.map((objective) => {
                      const config = objectiveConfig[objective];
                      const isSelected = tempObjectives.includes(objective);
                      
                      return (
                        <label
                          key={objective}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected 
                              ? "border-primary/50 bg-primary/5" 
                              : "border-border bg-card hover:bg-accent"
                          )}
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
                  </div>
                </>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t border-border pt-4">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleApply}
              >
                Aplicar Filtros
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
