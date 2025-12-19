import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface LoadingProgressProps {
  isLoading: boolean;
  estimatedTime?: number; // seconds
  message?: string;
}

export function LoadingProgress({ 
  isLoading, 
  estimatedTime = 5,
  message = "Carregando leads..." 
}: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Asymptotic progress - gets slower as it approaches 90%
        const remaining = 90 - prev;
        const increment = remaining * 0.1;
        return Math.min(prev + increment, 90);
      });
    }, (estimatedTime * 1000) / 20);

    return () => clearInterval(interval);
  }, [isLoading, estimatedTime]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress 
        value={progress} 
        className="h-1 rounded-none bg-muted/50" 
      />
      {isLoading && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-fade-in">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      )}
    </div>
  );
}
