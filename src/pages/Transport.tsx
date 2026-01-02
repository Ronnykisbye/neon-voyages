import React from "react";
import { Bus, Train, Plane, ExternalLink, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

function TransportContent() {
  const { trip } = useTrip();

  const mapsSearchUrl = trip.location
    ? `https://www.google.com/maps/search/public+transport/@${trip.location.lat},${trip.location.lon},14z`
    : "#";

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Transport" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Transport-information kan ikke verificeres automatisk. Brug de officielle links nedenfor.
          </p>
        </NeonCard>

        <div className="space-y-4">
          <NeonCard variant="interactive" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Google Maps Transport</h3>
                <p className="text-sm text-muted-foreground">Se offentlig transport i området</p>
              </div>
            </div>
            <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              Åbn i Google Maps
            </a>
          </NeonCard>

          <NeonCard variant="interactive" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Train className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Tog & Metro</h3>
                <p className="text-sm text-muted-foreground">Søg efter togforbindelser</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.rome2rio.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Rome2Rio
              </a>
              <a href="https://www.thetrainline.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Trainline
              </a>
            </div>
          </NeonCard>

          <NeonCard variant="interactive" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Bus</h3>
                <p className="text-sm text-muted-foreground">Fjernbus og lokale busser</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.flixbus.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                FlixBus
              </a>
              <a href="https://www.busbud.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                BusBud
              </a>
            </div>
          </NeonCard>

          <NeonCard variant="interactive" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Fly</h3>
                <p className="text-sm text-muted-foreground">Sammenlign flypriser</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.skyscanner.dk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Skyscanner
              </a>
              <a href="https://www.momondo.dk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Momondo
              </a>
            </div>
          </NeonCard>
        </div>
      </main>

      <TripDebug />
    </div>
  );
}

export default function Transport() {
  return (
    <TripGuard>
      <TransportContent />
    </TripGuard>
  );
}
