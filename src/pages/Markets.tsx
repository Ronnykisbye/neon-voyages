import React, { useEffect, useState, useCallback } from "react";
import { ShoppingBag, ExternalLink, Info } from "lucide-react";
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
  buildMarketsQuery,
  type OverpassElement 
} from "@/services/overpass";

function MarketsContent() {
  const { trip } = useTrip();
  const [markets, setMarkets] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const fetchMarkets = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "markets");
    
    const cached = getFromCache<OverpassElement[]>(cacheKey);
    if (cached) {
      setMarkets(cached);
      setLoading(false);
      return;
    }

    const radiusSteps = [6000, 12000, 20000];
    
    for (const radius of radiusSteps) {
      const query = buildMarketsQuery(lat, lon, radius);
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

      if (results.length >= 5 || radius === radiusSteps[radiusSteps.length - 1]) {
        setMarkets(results.slice(0, 30));
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
    fetchMarkets();
  }, [fetchMarkets]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Markeder & Butikker" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Lokale markeder og butikker inden for {radiusUsed / 1000} km fra OpenStreetMap.
            </p>
          </div>
        </NeonCard>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchMarkets} />
        )}

        {!loading && !error && markets.length > 0 && (
          <div className="space-y-4">
            {markets.map((market) => (
              <PlaceCard key={`${market.type}_${market.id}`} element={market} />
            ))}
          </div>
        )}

        {!loading && !error && markets.length === 0 && (
          <EmptyState 
            title="Ingen markeder fundet"
            message="OpenStreetMap har ikke markeder registreret i dette område. Prøv et mere centralt punkt."
          />
        )}

        <NeonCard padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Datakilde</span>
            <a 
              href="https://www.openstreetmap.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              OpenStreetMap
            </a>
          </div>
        </NeonCard>
      </main>

      <TripDebug />
    </div>
  );
}

export default function Markets() {
  return (
    <TripGuard>
      <MarketsContent />
    </TripGuard>
  );
}
