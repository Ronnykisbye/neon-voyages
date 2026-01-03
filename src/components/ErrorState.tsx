import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { NeonCard } from "./ui/NeonCard";
import { NeonButton } from "./ui/NeonButton";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = "Overpass er travl lige nu – prøv igen om lidt", 
  onRetry 
}: ErrorStateProps) {
  return (
    <NeonCard variant="default" className="text-center py-8">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <NeonButton onClick={onRetry} variant="default" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Prøv igen
        </NeonButton>
      )}
    </NeonCard>
  );
}
