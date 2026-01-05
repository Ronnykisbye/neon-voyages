// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React from "react";
import { Bus, Train, Plane, ExternalLink, MapPin, Ship, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

// ✅ Fælles km-vælger
import SearchControls, {
  readRadiusKm,
  type RadiusKm,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Konstanter
// ============================================================================
const DEFAULT_RADIUS_KM: RadiusKm = 6;

// ============================================================================
// AFSNIT 02 – Content
// ============================================================================
function TransportContent() {
  const { trip } = useTrip();

  // Fælles radius (kun til ens UX-tekst her, da vi ikke henter data i Transport)
  const [radiusKm, setRadiusKm] = React.useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  const mapsSearchUrl = trip.location
    ? `https://www.google.com/maps/search/public+transport/@${trip.location.lat},${trip.location.lon},14z`
    : "#";

  // Destination bruges til søge-links (ikke verificerede fakta – kun direkte søgning)
  const destination = encodeURIComponent(trip.destination || "");

  // ==========================================================================
  // AFSNIT 03 – UI
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Transport" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03A – Info + km-vælger (fælles UI)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {radiusKm} km fra centrum.
              </p>

              <div className="mt-3">
                <SearchControls
                  showRadius={true}
                  showScope={false}
                  radiusKm={radiusKm}
                  onRadiusChange={(km) => setRadiusKm(km)}
                />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Transport-information kan ikke verificeres automatisk. Brug de officielle links nedenfor.
              </p>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Link-kort
        ------------------------------------------------------------ */}
        <div className="space-y-4">
          {/* Google Maps Transport */}
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
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Åbn i Google Maps
            </a>
          </NeonCard>

          {/* Tog & Metro */}
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
              <a
                href="https://www.rome2rio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Rome2Rio
              </a>
              <a
                href="https://www.thetrainline.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Trainline
              </a>
            </div>
          </NeonCard>

          {/* Bus */}
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
              <a
                href="https://www.flixbus.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                FlixBus
              </a>
              <a
                href="https://www.busbud.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                BusBud
              </a>
            </div>
          </NeonCard>

          {/* Fly */}
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
              <a
                href="https://www.skyscanner.dk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Skyscanner
              </a>
              <a
                href="https://www.momondo.dk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Momondo
              </a>
            </div>
          </NeonCard>

          {/* ✅ Færger (kun links, ingen scraping/API) */}
          <NeonCard variant="interactive" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ship className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Færger</h3>
                <p className="text-sm text-muted-foreground">
                  Find færgeruter og priser via officielle søgesider
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.directferries.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Direct Ferries
              </a>

              <a
                href="https://www.ferryhopper.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ferryhopper
              </a>

              <a
                href="https://www.aferry.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                AFerry
              </a>

              {/* Ekstra: direkte Google-søgning på færger ved destination */}
              <a
                href={`https://www.google.com/search?q=ferries+from+${destination}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Søg færger (Google)
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Vi henter ikke ruter automatisk. Du får kun links til at søge direkte på eksterne sider.
            </p>
          </NeonCard>
        </div>
      </main>

      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 04 – Export wrapper
// ============================================================================
export default function Transport() {
  return (
    <TripGuard>
      <TransportContent />
    </TripGuard>
  );
}
