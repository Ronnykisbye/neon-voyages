// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
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
  buildMarketsQuery,
  type OverpassElement,
} from "@/services/overpass";

// ✅ Fælles km-vælger
import SearchControls, {
  readRadiusKm,
  toMeters,
  type RadiusKm,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Konstanter
// ============================================================================
const DEFAULT_RADIUS_KM: RadiusKm = 6;

// ============================================================================
// AFSNIT 02 – Hovedkomponent (Content)
// ============================================================================
function MarketsContent() {
  const { trip } = useTrip();

  // --------------------------------------------------------------------------
  // AFSNIT 02A – State
  // --------------------------------------------------------------------------
  const [markets, setMarkets] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fælles radius (fra localStorage)
  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  // Den radius vi faktisk endte med at søge i (kan auto-udvides)
  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(
    toMeters(baseRadiusKm)
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02B – Fetch (med forceRefresh)
  // --------------------------------------------------------------------------
  const fetchMarkets = useCallback(
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

      // Cache key inkluderer radius
      const cacheKey = getCacheKey(
        lat,
        lon,
        `markets-r${baseRadiusKm}km`
      );

      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setMarkets(cached);
          setLoading(false);
          return;
        }
      }

      const baseMeters = toMeters(baseRadiusKm);
      const radiusSteps = Array.from(
        new Set([baseMeters, Math.max(12000, baseMeters * 2), 20000])
      ).sort((a, b) => a - b);

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

        const results = (result.data || []).filter((el) => el.tags?.name);

        if (results.length >= 5 || radius === radiusSteps[radiusSteps.length - 1]) {
          const sliced = results.slice(0, 30);
          setMarkets(sliced);
          setRadiusUsedMeters(radius);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setMarkets([]);
      setLoading(false);
    },
    [trip.location, baseRadiusKm]
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02C – Auto-fetch ved load / radius-ændring
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const status = loading ? "loading" : markets.length > 0 ? "done" : "empty";

  // ========================================================================
  // AFSNIT 03 – UI
  // ========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Markeder & Butikker" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03A – Info + km-vælger
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {Math.round(radiusUsedMeters / 1000)} km fra centrum.
              </p>

              <div className="mt-3">
                <SearchControls
                  showRadius={true}
                  showScope={false}
                  radiusKm={baseRadiusKm}
                  onRadiusChange={(km) => {
                    setBaseRadiusKm(km);
                    setTimeout(
                      () => fetchMarkets({ forceRefresh: true }),
                      0
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Status + Søg igen
        ------------------------------------------------------------ */}
        <SearchStatusBar
          status={status}
          onRetry={() => fetchMarkets({ forceRefresh: true })}
        />

        {/* ------------------------------------------------------------
           AFSNIT 03C – Loading
        ------------------------------------------------------------ */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03D – Error
        ------------------------------------------------------------ */}
        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => fetchMarkets({ forceRefresh: true })}
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03E – Resultater
        ------------------------------------------------------------ */}
        {!loading && !error && markets.length > 0 && (
          <div className="space-y-4">
            {markets.map((market) => (
              <PlaceCard key={`${market.type}_${market.id}`} element={market} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03F – Empty
        ------------------------------------------------------------ */}
        {!loading && !error && markets.length === 0 && (
          <EmptyState
            title="Ingen markeder fundet"
            message="Prøv at øge afstanden eller tryk 'Søg igen'."
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03G – Datakilde
        ------------------------------------------------------------ */}
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

// ============================================================================
// AFSNIT 04 – Export wrapper med TripGuard
// ============================================================================
export default function Markets() {
  return (
    <TripGuard>
      <MarketsContent />
    </TripGuard>
  );
}
