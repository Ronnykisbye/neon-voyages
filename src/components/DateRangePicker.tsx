import React from "react";
import { format, addDays } from "date-fns";
import { da } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Ankomst
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-14 justify-start text-left font-normal text-lg rounded-xl border-border bg-card shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5" />
              {startDate ? (
                format(startDate, "d. MMMM yyyy", { locale: da })
              ) : (
                <span>Vælg dato</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onStartDateChange(date);
                if (date && endDate && date > endDate) {
                  onEndDateChange(addDays(date, 1));
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
              locale={da}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Afrejse
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-14 justify-start text-left font-normal text-lg rounded-xl border-border bg-card shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5" />
              {endDate ? (
                format(endDate, "d. MMMM yyyy", { locale: da })
              ) : (
                <span>Vælg dato</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) =>
                date < (startDate ? addDays(startDate, 1) : new Date())
              }
              initialFocus
              locale={da}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
