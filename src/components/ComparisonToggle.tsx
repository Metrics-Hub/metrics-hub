import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GitCompare } from "lucide-react";

interface ComparisonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  isLoading?: boolean;
}

export function ComparisonToggle({ enabled, onChange, isLoading }: ComparisonToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="comparison-mode"
        checked={enabled}
        onCheckedChange={onChange}
        disabled={isLoading}
      />
      <Label 
        htmlFor="comparison-mode" 
        className="text-sm text-muted-foreground flex items-center gap-1.5 cursor-pointer"
      >
        <GitCompare className="h-3.5 w-3.5" />
        Comparar períodos
      </Label>
    </div>
  );
}
