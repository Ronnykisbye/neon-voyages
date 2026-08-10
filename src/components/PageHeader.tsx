import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Toilet } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backTo = "/menu",
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(backTo);
  };

  return (
    <header className={cn("flex items-center gap-4 py-4", className)}>
      {showBack && (
        <button
          onClick={handleBack}
          className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-foreground shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all active:scale-95 cursor-pointer"
          aria-label="Tilbage"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {location.pathname !== "/toilet-nearby" && (
          <button
            type="button"
            onClick={() => navigate("/toilet-nearby")}
            aria-label="Find offentligt toilet"
            title="Toilet nær mig"
            className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-primary shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all active:scale-95 cursor-pointer"
          >
            <Toilet className="h-5 w-5" />
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
