import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SectionVisibility {
  smartAlerts: boolean;
  aiInsights: boolean;
  charts: boolean;
  funnel: boolean;
  rankings: boolean;
  adsTable: boolean;
}

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  smartAlerts: true,
  aiInsights: true,
  charts: true,
  funnel: true,
  rankings: true,
  adsTable: true,
};

const SECTION_LABELS: Record<keyof SectionVisibility, string> = {
  smartAlerts: "Alertas Inteligentes",
  aiInsights: "Insights de IA",
  charts: "Gráficos",
  funnel: "Funil de Conversão",
  rankings: "Rankings",
  adsTable: "Tabela de Campanhas",
};

interface DashboardSectionTogglesProps {
  visibility: SectionVisibility;
  onVisibilityChange: (visibility: SectionVisibility) => void;
  isLoading?: boolean;
}

export function DashboardSectionToggles({
  visibility,
  onVisibilityChange,
  isLoading = false,
}: DashboardSectionTogglesProps) {
  const hiddenCount = Object.values(visibility).filter((v) => !v).length;
  const allVisible = hiddenCount === 0;

  const handleToggle = (key: keyof SectionVisibility) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  const handleShowAll = () => {
    onVisibilityChange(DEFAULT_SECTION_VISIBILITY);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 h-8",
            hiddenCount > 0 && "text-muted-foreground"
          )}
          disabled={isLoading}
        >
          {allVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <span className="hidden md:inline">Seções</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {hiddenCount} ocultas
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Visibilidade das Seções
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-3">
          {(Object.keys(SECTION_LABELS) as (keyof SectionVisibility)[]).map(
            (key) => (
              <div key={key} className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm",
                    !visibility[key] && "text-muted-foreground"
                  )}
                >
                  {SECTION_LABELS[key]}
                </span>
                <Switch
                  checked={visibility[key]}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={isLoading}
                />
              </div>
            )
          )}
        </div>
        {hiddenCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-primary hover:text-primary"
                onClick={handleShowAll}
                disabled={isLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Mostrar Todas
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
