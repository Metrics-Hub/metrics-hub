import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FacebookIcon, GoogleIcon } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";

export type DataSource = "meta" | "google";
export type DataSources = DataSource[];

interface DataSourceSelectorProps {
  value: DataSources;
  onChange: (value: DataSources) => void;
  hasMetaAds: boolean;
  hasGoogleAds: boolean;
  className?: string;
  compact?: boolean;
}

export function DataSourceSelector({
  value,
  onChange,
  hasMetaAds,
  hasGoogleAds,
  className = "",
  compact = false,
}: DataSourceSelectorProps) {
  // If only one source is available, don't show selector
  if (!hasMetaAds && !hasGoogleAds) return null;
  if (hasMetaAds && !hasGoogleAds) return null;
  if (!hasMetaAds && hasGoogleAds) return null;

  const handleChange = (newValue: string[]) => {
    // Ensure at least one source is always selected
    if (newValue.length === 0) {
      return; // Don't allow empty selection
    }
    onChange(newValue as DataSources);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact && (
        <span className="text-sm text-muted-foreground hidden sm:inline">Fonte:</span>
      )}
      <ToggleGroup type="multiple" value={value} onValueChange={handleChange} className="gap-1">
        <ToggleGroupItem 
          value="meta" 
          aria-label="Meta Ads"
          className={cn(
            "rounded-full border-0 transition-all duration-200",
            compact 
              ? "px-2 py-1 h-8 min-w-[44px]" 
              : "px-2 py-0.5 h-6",
            "data-[state=on]:bg-[hsl(221,70%,50%)] data-[state=on]:text-white data-[state=on]:shadow-sm",
            "data-[state=off]:bg-muted/50 data-[state=off]:text-muted-foreground",
            "hover:data-[state=off]:bg-muted",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground/50",
            "disabled:border disabled:border-dashed disabled:border-muted-foreground/30"
          )}
          disabled={!hasMetaAds}
        >
          <span className="flex items-center gap-1">
            <FacebookIcon className={cn(compact ? "w-4 h-4" : "w-3.5 h-3.5")} />
            <span className={cn(
              "font-medium",
              compact ? "text-xs" : "hidden sm:inline text-xs"
            )}>
              Meta
            </span>
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="google" 
          aria-label="Google Ads"
          className={cn(
            "rounded-full border-0 transition-all duration-200",
            compact 
              ? "px-2 py-1 h-8 min-w-[44px]" 
              : "px-2 py-0.5 h-6",
            "data-[state=on]:bg-[hsl(12,80%,55%)] data-[state=on]:text-white data-[state=on]:shadow-sm",
            "data-[state=off]:bg-muted/50 data-[state=off]:text-muted-foreground",
            "hover:data-[state=off]:bg-muted",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground/50",
            "disabled:border disabled:border-dashed disabled:border-muted-foreground/30"
          )}
          disabled={!hasGoogleAds}
        >
          <span className="flex items-center gap-1">
            <GoogleIcon className={cn(
              "[&_path]:fill-current",
              compact ? "w-4 h-4" : "w-3.5 h-3.5"
            )} />
            <span className={cn(
              "font-medium",
              compact ? "text-xs" : "hidden sm:inline text-xs"
            )}>
              Google
            </span>
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
