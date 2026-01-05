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
  type OverpassElement,
} from "@/services/overpass";

function HiddenGemsContent() {
  const { trip } = useTrip();
  const [gems, setGems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const fetchGems = useCallback(
    async (opts?: { forceRefresh?: boolean }) => {
      const forceRefresh = opts?.forceRefresh === true;

      if (!trip.location) {
        setError("Ingen lokation fundet");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { lat, lon } = trip.location;
      const cacheKey = getCacheKey(lat, lon, "hidden-gems");

      // Cache først – men ikke hvis brugeren trykker "Søg igen"
      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setGems(cached);
          setLoading(false);
          return;
        }
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

        const results = (result.data || []).filter((el) => el.tags?.name);

        if (results.length >= 10 || radius === radiusSteps[radiusSteps.length - 1]) {
          const sliced = results.slice(0, 30);
          setGems(sliced);
          setRadiusUsed(radius);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setGems([]);
      setLoading(false);
    },
    [trip.location]
  );

  useEffect(() => {
    fetchGems();
  }, [fetchGems]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Skjulte perler" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Finder skjulte perler inden for {radiusUsed / 1000} km fra centrum. Data fra OpenStreetMap (gratis, ingen API-nøgle).
            </p>
          </div>
        </NeonCard>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {loading ? "Søger i OpenStreetMap..." : gems.length > 0 ? "Resultater fundet" : "Ingen data fundet i dette område"}
          </div>

          <NeonButton
            size="sm"
            onClick={() => fetchGems({ forceRefresh: true })}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Søg igen
          </NeonButton>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={() => fetchGems({ forceRefresh: true })} />}

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

export default function HiddenGems() {
  return (
    <TripGuard>
      <HiddenGemsContent />
    </TripGuard>
  );
}
