import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Info } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { cn } from "@/lib/utils";

interface VersionFooterProps {
    className?: string;
    variant?: "badge" | "footer";
}

export function VersionFooter({ className, variant = "footer" }: VersionFooterProps) {
    const [changelogOpen, setChangelogOpen] = useState(false);
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    if (variant === "badge") {
        return (
            <>
                <div className={cn("flex items-center gap-2", className)}>
                    {needRefresh ? (
                        <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-2 text-xs gap-1.5 animate-pulse"
                            onClick={handleUpdate}
                        >
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Atualizar
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-normal"
                            onClick={() => setChangelogOpen(true)}
                        >
                            <span className="opacity-50">v{__APP_VERSION__}</span>
                        </Button>
                    )}
                </div>
                <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
            </>
        );
    }

    return (
        <>
            <div className={cn("flex items-center justify-center gap-2 py-2 px-4", className)}>
                {needRefresh ? (
                    <div className="flex items-center gap-3 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 animate-fade-in">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Nova versão disponível</span>
                        <Button size="sm" variant="default" className="h-7 px-3 text-xs" onClick={handleUpdate}>
                            Atualizar
                        </Button>
                    </div>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setChangelogOpen(true)}
                                className="group flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
                            >
                                <span>Metrics Hub v{__APP_VERSION__}</span>
                                <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Clique para ver o histórico de versões</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
        </>
    );
}
