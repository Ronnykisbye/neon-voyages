import React, { useEffect, useState, useCallback } from "react";
import { Landmark, ExternalLink, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceSkeleton } from "@/components/PlaceSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";
import { 
  queryOverpass, 
  getCacheKey, 
  getFromCache, 
  setCache,
  buildAttractionsQuery,
  type OverpassElement 
} from "@/services/overpass";

function TouristSpotsContent() {
  const { trip } = useTrip();
  const [attractions, setAttractions] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const loadAttractions = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "attractions");
    
    // Check cache first (24h)
    const cached = getFromCache<OverpassElement[]>(cacheKey);
    if (cached) {
      setAttractions(cached);
      setLoading(false);
      return;
    }

    // Try with increasing radius: 6km, 12km, 20km
    const radiusSteps = [6000, 12000, 20000];
    
    for (const radius of radiusSteps) {
      const query = buildAttractionsQuery(lat, lon, radius);
      const result = await queryOverpass(query);

      if (result.error) {
        // If last radius also fails, show error
        if (radius === radiusSteps[radiusSteps.length - 1]) {
          setError(result.error);
          setLoading(false);
          return;
        }
        // Try smaller radius on timeout
        continue;
      }

      const results = (result.data || []).filter(el => el.tags?.name);

      if (results.length >= 10 || radius === radiusSteps[radiusSteps.length - 1]) {
        setAttractions(results.slice(0, 40));
        setRadiusUsed(radius);
        setCache(cacheKey, results.slice(0, 40));
        setLoading(false);
        return;
      }
    }

    setError("Overpass er travl lige nu – prøv igen om lidt");
    setLoading(false);
  }, [trip.location]);

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* Info card */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Viser seværdigheder inden for {radiusUsed / 1000} km fra centrum. 
              Data fra OpenStreetMap (gratis, ingen API-nøgle).
            </p>
          </div>
        </NeonCard>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state with retry */}
        {!loading && error && (
          <ErrorState message={error} onRetry={loadAttractions} />
        )}

        {/* Results */}
        {!loading && !error && attractions.length > 0 && (
          <div className="space-y-4">
            {attractions.map((attraction) => (
              <PlaceCard key={`${attraction.type}_${attraction.id}`} element={attraction} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && attractions.length === 0 && (
          <EmptyState 
            title="Ingen seværdigheder fundet"
            message="OpenStreetMap har muligvis ikke detaljerede data for dette område. Prøv et mere centralt punkt, eller brug Google Maps direkte."
          />
        )}

        {/* Source attribution */}
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
              © OpenStreetMap bidragydere
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
