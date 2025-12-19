import * as React from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

interface PresetOption {
  label: string;
  getValue: () => DateRange;
}

const getPresets = (): PresetOption[] => {
  const today = new Date();
  
  return [
    {
      label: "Hoje",
      getValue: () => ({ from: today, to: today }),
    },
    {
      label: "Ontem",
      getValue: () => {
        const yesterday = subDays(today, 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: "Últimos 7 dias",
      getValue: () => ({ from: subDays(today, 6), to: today }),
    },
    {
      label: "Últimos 14 dias",
      getValue: () => ({ from: subDays(today, 13), to: today }),
    },
    {
      label: "Últimos 28 dias",
      getValue: () => ({ from: subDays(today, 27), to: today }),
    },
    {
      label: "Últimos 30 dias",
      getValue: () => ({ from: subDays(today, 29), to: today }),
    },
    {
      label: "Esta semana",
      getValue: () => ({
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: today,
      }),
    },
    {
      label: "Semana passada",
      getValue: () => {
        const lastWeek = subWeeks(today, 1);
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      },
    },
    {
      label: "Este mês",
      getValue: () => ({
        from: startOfMonth(today),
        to: today,
      }),
    },
    {
      label: "Mês passado",
      getValue: () => {
        const lastMonth = subMonths(today, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
    {
      label: "Últimos 3 meses",
      getValue: () => ({ from: subMonths(today, 3), to: today }),
    },
  ];
};

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(date?.from || new Date());
  const presets = React.useMemo(() => getPresets(), []);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (isOpen) {
      setTempDate(date);
      setCalendarMonth(date?.from || new Date());
    }
  }, [isOpen, date]);

  const handlePresetClick = (preset: PresetOption) => {
    const newRange = preset.getValue();
    setTempDate(newRange);
    setCalendarMonth(newRange.from || new Date());
  };

  const handleApply = () => {
    onDateChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(date);
    setIsOpen(false);
  };

  const isPresetSelected = (preset: PresetOption) => {
    if (!tempDate?.from || !tempDate?.to) return false;
    const presetValue = preset.getValue();
    return (
      format(tempDate.from, "yyyy-MM-dd") === format(presetValue.from!, "yyyy-MM-dd") &&
      format(tempDate.to, "yyyy-MM-dd") === format(presetValue.to!, "yyyy-MM-dd")
    );
  };

  const triggerButton = (
    <Button
      id="date"
      variant="outline"
      className={cn(
        "justify-start text-left font-normal h-9",
        !date && "text-muted-foreground",
        isMobile ? "w-full" : "w-auto"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
      {date?.from ? (
        date.to ? (
          <span className="truncate">
            {format(date.from, "dd MMM", { locale: ptBR })} -{" "}
            {format(date.to, "dd MMM", { locale: ptBR })}
          </span>
        ) : (
          format(date.from, "dd MMM yyyy", { locale: ptBR })
        )
      ) : (
        <span>Período</span>
      )}
    </Button>
  );

  const presetsContent = (
    <ScrollArea className={cn(isMobile ? "w-full pb-2" : "w-40 max-h-[400px]")}>
      <div className={cn(
        isMobile 
          ? "flex gap-2 px-4 py-2" 
          : "p-2 space-y-0.5"
      )}>
        {!isMobile && (
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            Atalhos
          </p>
        )}
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "text-sm transition-colors whitespace-nowrap",
              isMobile
                ? cn(
                    "px-3 py-2 rounded-full border",
                    isPresetSelected(preset)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  )
                : cn(
                    "w-full text-left px-2 py-1.5 rounded-md",
                    isPresetSelected(preset)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {isMobile && <ScrollBar orientation="horizontal" />}
    </ScrollArea>
  );

  const calendarContent = (
    <div className="flex flex-col">
      <Calendar
        initialFocus
        mode="range"
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
        selected={tempDate}
        onSelect={setTempDate}
        numberOfMonths={isMobile ? 1 : 2}
        locale={ptBR}
        className="p-3 pointer-events-auto"
      />
    </div>
  );

  const footerContent = (
    <div className={cn(
      "flex items-center justify-between p-3 bg-muted/30 border-t border-border",
      isMobile && "flex-col gap-3"
    )}>
      <div className={cn(
        "text-sm text-muted-foreground",
        isMobile && "text-center"
      )}>
        {tempDate?.from && tempDate?.to ? (
          <>
            {format(tempDate.from, "d 'de' MMM", { locale: ptBR })} -{" "}
            {format(tempDate.to, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </>
        ) : (
          "Selecione um período"
        )}
      </div>
      <div className={cn(
        "flex gap-2",
        isMobile && "w-full"
      )}>
        <Button 
          variant="outline" 
          size={isMobile ? "default" : "sm"} 
          onClick={handleCancel}
          className={cn(isMobile && "flex-1")}
        >
          Cancelar
        </Button>
        <Button 
          size={isMobile ? "default" : "sm"} 
          onClick={handleApply}
          className={cn(isMobile && "flex-1")}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <div className={cn("grid gap-2", className)}>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <div onClick={() => setIsOpen(true)}>
            {triggerButton}
          </div>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="pb-0">
              <DrawerTitle className="text-center">Selecionar Período</DrawerTitle>
            </DrawerHeader>
            
            {/* Presets as horizontal scrollable chips */}
            {presetsContent}
            
            <Separator />
            
            {/* Calendar */}
            <div className="flex justify-center overflow-auto">
              {calendarContent}
            </div>
            
            {/* Footer */}
            {footerContent}
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop: Use Popover
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-popover border-border shadow-lg" 
          align="end"
          sideOffset={8}
        >
          <div className="flex">
            {/* Presets sidebar */}
            <div className="border-r border-border">
              {presetsContent}
            </div>

            {/* Calendar area */}
            <div className="flex flex-col">
              {calendarContent}
              <Separator />
              {footerContent}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
