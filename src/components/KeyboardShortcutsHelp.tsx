import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function KeyboardShortcutsHelp() {
  const { shortcuts, helpModalOpen, setHelpModalOpen } = useKeyboardShortcuts();

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl";

  const formatShortcut = (shortcut: typeof shortcuts[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrlOrCmd) parts.push(cmdKey);
    if (shortcut.shift) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key + (shortcut.ctrlOrCmd ? "ctrl" : "") + (shortcut.shift ? "shift" : "")}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Pressione <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">?</kbd> a qualquer momento para ver esta ajuda
        </p>
      </DialogContent>
    </Dialog>
  );
}
