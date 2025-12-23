import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { changelogData } from "@/config/changelog";

interface ChangelogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Novidades
                        <Badge variant="secondary" className="text-xs font-normal">
                            v{__APP_VERSION__}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Histórico de atualizações e melhorias do sistema
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 pb-6">
                    <div className="space-y-8 py-4">
                        {changelogData.map((entry, index) => (
                            <div key={entry.version} className="relative pl-6 pb-2 border-l border-border/50 last:border-0">
                                {/* Timeline dot */}
                                <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />

                                <div className="flex items-baseline justify-between mb-2">
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        v{entry.version}
                                        {index === 0 && (
                                            <Badge className="h-5 px-1.5 text-[10px]">Atual</Badge>
                                        )}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                                </div>

                                <ul className="space-y-2">
                                    {entry.changes.map((change, i) => (
                                        <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                                            <span className="block mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
