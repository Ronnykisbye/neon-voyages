import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-foreground shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all active:scale-95",
        className
      )}
      aria-label={theme === "dark" ? "Skift til lyst tema" : "Skift til mørkt tema"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
