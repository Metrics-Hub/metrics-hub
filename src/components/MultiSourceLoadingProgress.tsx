import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { FacebookIcon, GoogleIcon } from "./DataSourceBadge";
import { DataSources } from "@/components/DataSourceSelector";

interface MultiSourceLoadingProgressProps {
  isMetaLoading: boolean;
  isGoogleLoading: boolean;
  metaProgress: number;
  googleProgress: number;
  dataSources: DataSources;
}

interface SourceProgressProps {
  label: string;
  icon: React.ReactNode;
  isLoading: boolean;
  progress: number;
  colorClass: string;
  bgClass: string;
}

function SourceProgress({ label, icon, isLoading, progress, colorClass, bgClass }: SourceProgressProps) {
  const isComplete = progress >= 100 && !isLoading;

  return (
    <div className="flex items-center gap-3 flex-1 min-w-[140px]">
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full",
        isComplete ? "bg-green-100 dark:bg-green-900/30" : bgClass
      )}>
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </motion.div>
        ) : isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            {icon}
          </motion.div>
        ) : (
          icon
        )}
      </div>

      {/* Progress bar and label */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">{label}</span>
          <span className={cn(
            "font-medium tabular-nums",
            isComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className={cn("h-1.5 rounded-full overflow-hidden", bgClass)}>
          <motion.div
            className={cn("h-full rounded-full", isComplete ? "bg-green-500" : colorClass)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

export function MultiSourceLoadingProgress({
  isMetaLoading,
  isGoogleLoading,
  metaProgress,
  googleProgress,
  dataSources,
}: MultiSourceLoadingProgressProps) {
  // Only show when loading data from multiple sources
  const hasBothSources = dataSources.includes("meta") && dataSources.includes("google");
  if (!hasBothSources) return null;
  
  const isAnyLoading = isMetaLoading || isGoogleLoading;
  const bothComplete = metaProgress >= 100 && googleProgress >= 100 && !isAnyLoading;

  return (
    <AnimatePresence>
      {(isAnyLoading || (metaProgress > 0 || googleProgress > 0)) && !bothComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-muted/50 border-b"
        >
          <div className="container px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Sincronizando fontes de dados...
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <SourceProgress
                label="Meta Ads"
                icon={<FacebookIcon className="h-4 w-4 text-[hsl(221,70%,50%)]" />}
                isLoading={isMetaLoading}
                progress={metaProgress}
                colorClass="bg-[hsl(221,70%,50%)]"
                bgClass="bg-[hsl(221,70%,50%)]/10"
              />
              
              <SourceProgress
                label="Google Ads"
                icon={<GoogleIcon className="h-4 w-4 [&_path]:fill-[hsl(12,80%,55%)]" />}
                isLoading={isGoogleLoading}
                progress={googleProgress}
                colorClass="bg-[hsl(12,80%,55%)]"
                bgClass="bg-[hsl(12,80%,55%)]/10"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
