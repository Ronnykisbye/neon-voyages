import React from "react";
import { Search } from "lucide-react";
import { NeonCard } from "./ui/NeonCard";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ 
  title = "Ingen resultater fundet",
  message = "Prøv at vælge en større by eller et mere centralt område."
}: EmptyStateProps) {
  return (
    <NeonCard variant="default" className="text-center py-8">
      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{message}</p>
    </NeonCard>
  );
}
