import React, { useEffect, useState, useCallback } from "react";
import { ExternalLink, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceSkeleton } from "@/components/PlaceSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import SearchStatusBar from "@/components/SearchStatusBar";
import { useTrip } from "@/context/TripContext";
import {
  queryOverpass,
  getCacheKey,
  getFromCache,
  setCache,
  type OverpassElement,
} from "@/services/overpass";

/**
 * Bygger en robust Overpass-query for "Seværdigheder".
 * Fokus: tourism=* (attraktioner), historic=*, samt nogle sikre "klassikere".
 * (Ingen scraping, ingen API-nøgle, kun OSM/Overpass)
 */
function buildTouristSpotsQuery(lat: number, lon: number, radius: number) {
  return `
[out:json][timeout:25];
(
  // Klassiske turist-tags
  nwr(around:${radius},${lat},${lon})["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"];
  // Historiske steder
  nwr(around:${radius},${lat},${lon})["historic"];
  // Parker (ofte gode seværdigheder)
  nwr(around:${radius},${lat},${lon})["leisure"="park"];
  // Kendte monumenter/memorials
  nwr(around:${radius},${lat},${lon})["historic"~"^(monument|memorial)$"];
);
out center tags;
`;
}

function TouristSpotsContent() {
  const { trip } = useTrip();
  const [spots, setSpots] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const fetchSpots = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "tourist-spots");

    // Cache først (30 min / 24h afhænger af din overpass-service – vi bruger samme cache-metode som resten)
    const cached = getFromCache<OverpassElement[]>(cacheKey);
    if (cached) {
      setSpots(cached);
      setLoading(false);
      return;
    }

    // Radius-trin: 6km, 12km, 20km (som HiddenGems)
    const radiusSteps = [6000, 12000, 20000];

    for (const radius of radiusSteps) {
      const query = buildTouristSpotsQuery(lat, lon, radius);
      const result = await queryOverpass(query);

      if (result.error) {
        // hvis sidste forsøg → vis fejl
        if (radius === radiusSteps[radiusSteps.length - 1]) {
          setError(result.error);
          setLoading(false);
          return;
        }
        // ellers prøv større radius
        continue;
      }

      // Filtrér: vi vil helst have navngivne steder
      const results = (result.data || []).filter((el) => el.tags?.name);

      // Stop hvis vi har "nok" – ellers prøv større radius
      if (results.length >= 12 || radius === radiusSteps[radiusSteps.length - 1]) {
        const sliced = results.slice(0, 30);
        setSpots(sliced);
        setRadiusUsed(radius);
        setCache(cacheKey, sliced);
        setLoading(false);
        return;
      }
    }

    // Hvis vi (meget usandsynligt) ender her:
    setSpots([]);
    setLoading(false);
  }, [trip.location]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Status til din statusbar (kompakt, ikke fuldskærm)
  const status = loading ? "loading" : spots.length > 0 ? "done" : "empty";

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* Info card */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Viser seværdigheder inden for {radiusUsed / 1000} km fra centrum. Data fra OpenStreetMap (gratis, ingen API-nøgle).
            </p>
          </div>
        </NeonCard>

        {/* Status + Søg igen (virker rigtigt, fordi den kalder fetchSpots) */}
        <SearchStatusBar status={status} onRetry={fetchSpots} />

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={fetchSpots} />}

        {!loading && !error && spots.length > 0 && (
          <div className="space-y-4">
            {spots.map((spot) => (
              <PlaceCard key={`${spot.type}_${spot.id}`} element={spot} />
            ))}
          </div>
        )}

        {!loading && !error && spots.length === 0 && (
          <EmptyState
            title="Ingen seværdigheder fundet"
            message="OpenStreetMap kan mangle detaljer i dette område. Tryk 'Søg igen' eller prøv en mere central destination."
          />
        )}

        <NeonCard padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Datakilde</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              © OpenStreetMap
            </a>
          </div>
        </NeonCard>
      </main>

      <TripDebug />
    </div>
  );
}

export default function TouristSpots() {
  return (
    <TripGuard>
      <TouristSpotsContent />
    </TripGuard>
  );
}
