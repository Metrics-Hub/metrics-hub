import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MinLeadsSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const OPTIONS = [1, 3, 5, 10, 15, 20];

export function MinLeadsSelector({ value, onChange }: MinLeadsSelectorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Mín. leads:</span>
            <Select
              value={value.toString()}
              onValueChange={(v) => onChange(parseInt(v))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Itens com menos leads serão excluídos da análise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
