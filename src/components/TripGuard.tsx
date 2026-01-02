import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Home } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface TripGuardProps {
  children: React.ReactNode;
  requireLocation?: boolean;
}

export function TripGuard({ children, requireLocation = true }: TripGuardProps) {
  const navigate = useNavigate();
  const { trip, isValid, hasLocation } = useTrip();

  // Check if we need location and don't have it
  const needsLocation = requireLocation && !hasLocation;
  
  // Show guard if trip isn't valid OR if we need location but don't have it
  if (!isValid || needsLocation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto animate-fade-in">
        <NeonCard variant="glow" className="w-full text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Vælg destination og dato først
            </h2>
            <p className="text-muted-foreground">
              {!trip.destination 
                ? "Du skal vælge en destination før du kan fortsætte."
                : !hasLocation
                ? "Vælg venligst en destination fra forslagslisten for at få koordinater."
                : "Du skal vælge rejsedatoer før du kan fortsætte."}
            </p>
          </div>

          <NeonButton
            onClick={() => navigate("/")}
            size="lg"
            className="w-full gap-2"
          >
            <Home className="h-5 w-5" />
            Gå til forsiden
          </NeonButton>
        </NeonCard>
      </div>
    );
  }

  return <>{children}</>;
}
