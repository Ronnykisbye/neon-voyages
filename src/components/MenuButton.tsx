import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  to: string;
  variant?: "primary" | "accent" | "secondary" | "default";
  className?: string;
}

export function MenuButton({
  icon,
  label,
  description,
  to,
  variant = "default",
  className,
}: MenuButtonProps) {
  const navigate = useNavigate();

  const variantStyles = {
    primary: "hover:shadow-neon-primary hover:border-primary/50",
    accent: "hover:shadow-neon-accent hover:border-accent/50",
    secondary: "hover:shadow-neon-secondary hover:border-secondary/50",
    default: "hover:shadow-neon-primary hover:border-primary/50",
  };

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "w-full min-h-[4.5rem] px-5 py-4 rounded-xl border border-border bg-card text-card-foreground shadow-card transition-all active:scale-[0.98] flex items-center gap-4 text-left",
        variantStyles[variant],
        className
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-lg">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
