import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, ExternalLink, RefreshCw, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
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
  buildHiddenGemsQuery,
  type OverpassElement 
} from "@/services/overpass";

function HiddenGemsContent() {
  const { trip } = useTrip();
  const [gems, setGems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const fetchGems = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "hidden-gems");
    
    // Check cache first (24h)
    const cached = getFromCache<OverpassElement[]>(cacheKey);
    if (cached) {
      setGems(cached);
      setLoading(false);
      return;
    }

    // Try with increasing radius: 6km, 12km, 20km
    const radiusSteps = [6000, 12000, 20000];
    
    for (const radius of radiusSteps) {
      const query = buildHiddenGemsQuery(lat, lon, radius);
      const result = await queryOverpass(query);

      if (result.error) {
        if (radius === radiusSteps[radiusSteps.length - 1]) {
          setError(result.error);
          setLoading(false);
          return;
        }
        continue;
      }

      const results = (result.data || []).filter(el => el.tags?.name);

      if (results.length >= 10 || radius === radiusSteps[radiusSteps.length - 1]) {
        setGems(results.slice(0, 30));
        setRadiusUsed(radius);
        setCache(cacheKey, results.slice(0, 30));
        setLoading(false);
        return;
      }
    }

    setError("Overpass er travl lige nu – prøv igen om lidt");
    setLoading(false);
  }, [trip.location]);

  useEffect(() => {
    fetchGems();
  }, [fetchGems]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Skjulte perler" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* Info card */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Unikke steder inden for {radiusUsed / 1000} km – udsigter, kunst, haver og ruiner fra OpenStreetMap.
            </p>
          </div>
        </NeonCard>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchGems} />
        )}

        {!loading && !error && gems.length > 0 && (
          <div className="space-y-4">
            {gems.map((gem) => (
              <PlaceCard key={`${gem.type}_${gem.id}`} element={gem} />
            ))}
          </div>
        )}

        {!loading && !error && gems.length === 0 && (
          <EmptyState 
            title="Ingen skjulte perler fundet"
            message="OpenStreetMap har muligvis ikke detaljerede data for dette område. Prøv et mere centralt punkt."
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

export default function HiddenGems() {
  return (
    <TripGuard>
      <HiddenGemsContent />
    </TripGuard>
  );
}
