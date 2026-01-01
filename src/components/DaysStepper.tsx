import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DaysStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function DaysStepper({
  value,
  onChange,
  min = 1,
  max = 30,
  className,
}: DaysStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-muted-foreground">
        Antal dage
      </label>
      <div className="flex items-center gap-4">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center text-foreground shadow-card hover:shadow-neon-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="Færre dage"
        >
          <Minus className="h-6 w-6" />
        </button>

        <div className="flex-1 h-14 rounded-xl border border-border bg-card flex items-center justify-center shadow-card">
          <span className="text-2xl font-semibold text-foreground">
            {value}
          </span>
          <span className="ml-2 text-muted-foreground">
            {value === 1 ? "dag" : "dage"}
          </span>
        </div>

        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center text-foreground shadow-card hover:shadow-neon-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="Flere dage"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
