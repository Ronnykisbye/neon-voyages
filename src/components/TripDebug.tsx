import React from "react";
import { useTrip } from "@/context/TripContext";
import { MapPin, Check, X } from "lucide-react";

export function TripDebug() {
  // Only show in development/preview
  if (import.meta.env.PROD) {
    return null;
  }

  const { trip, hasLocation } = useTrip();

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-50">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/95 border border-border shadow-lg text-xs font-mono backdrop-blur-sm">
        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span className="text-muted-foreground truncate">
          Trip: {trip.destination || "(ingen destination)"}
        </span>
        {trip.location ? (
          <>
            <span className="text-muted-foreground">
              ({trip.location.lat.toFixed(2)}, {trip.location.lon.toFixed(2)})
            </span>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </>
        ) : (
          <>
            <span className="text-muted-foreground">(no coords)</span>
            <X className="h-3.5 w-3.5 text-destructive" />
          </>
        )}
      </div>
    </div>
  );
}
