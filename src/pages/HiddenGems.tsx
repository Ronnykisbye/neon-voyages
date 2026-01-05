// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useState, useCallback } from "react";
import { ExternalLink, Info, RefreshCw, Sparkles } from "lucide-react";
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

// ✅ Fælles kontrol-komponent (km-vælger)
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
function HiddenGemsContent() {
  const { trip } = useTrip();

  // --------------------------------------------------------------------------
  // AFSNIT 02A – State
  // --------------------------------------------------------------------------
  const [gems, setGems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Brug fælles radius-setting (gemmes i localStorage via SearchControls)
  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  // Hvad vi endte med at søge i (kan udvide automatisk hvis få resultater)
  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(
    toMeters(baseRadiusKm)
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02B – Fetch funktion (med forceRefresh)
  // --------------------------------------------------------------------------
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

      // Cache skal afhænge af radius-valg, ellers får du “forkerte” cached svar
      const cacheKey = getCacheKey(lat, lon, `hidden-gems-r${baseRadiusKm}km`);

      // Cache først – men ikke hvis brugeren trykker “Søg igen”
      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setGems(cached);
          setLoading(false);
          return;
        }
      }

      // Radius-trin: start med valgt radius, og udvid hvis der er få resultater
      const baseMeters = toMeters(baseRadiusKm);
      const radiusSteps = Array.from(
        new Set([baseMeters, Math.max(12000, baseMeters * 2), 20000])
      ).sort((a, b) => a - b);

      for (const radiusMeters of radiusSteps) {
        const query = buildHiddenGemsQuery(lat, lon, radiusMeters);
        const result = await queryOverpass(query);

        if (result.error) {
          if (radiusMeters === radiusSteps[radiusSteps.length - 1]) {
            setError(result.error);
            setLoading(false);
            return;
          }
          continue;
        }

        // Kun steder med navn (kvalitet)
        const results = (result.data || []).filter((el) => el.tags?.name);

        // Stop hvis vi har “nok”, ellers prøv større radius
        if (
          results.length >= 10 ||
          radiusMeters === radiusSteps[radiusSteps.length - 1]
        ) {
          const sliced = results.slice(0, 30);
          setGems(sliced);
          setRadiusUsedMeters(radiusMeters);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      // Intet fundet
      setGems([]);
      setLoading(false);
    },
    [trip.location, baseRadiusKm]
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02C – Auto-fetch på load / når radius ændres
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchGems();
  }, [fetchGems]);

  // ========================================================================
  // AFSNIT 03 – UI
  // ========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Skjulte perler" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03A – Info kort + KM-vælger (fælles komponent)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {Math.round(radiusUsedMeters / 1000)} km fra centrum.
              </p>

              <SearchControls
                showRadius={true}
                showScope={false}
                radiusKm={baseRadiusKm}
                onRadiusChange={(km) => {
                  setBaseRadiusKm(km);
                  // Skift radius => hent nye data nu (force refresh)
                  setTimeout(() => fetchGems({ forceRefresh: true }), 0);
                }}
              />
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Statuslinje + Søg igen (force refresh)
        ------------------------------------------------------------ */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {loading
              ? "Søger i OpenStreetMap..."
              : gems.length > 0
              ? "Resultater fundet"
              : "Ingen data fundet i dette område"}
          </div>

          <NeonButton
            size="sm"
            onClick={() => fetchGems({ forceRefresh: true })}
            disabled={loading}
            aria-label="Søg igen"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Søg igen
          </NeonButton>
        </div>

        {/* ------------------------------------------------------------
           AFSNIT 03C – Loading (skeletons)
        ------------------------------------------------------------ */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03D – Error state
        ------------------------------------------------------------ */}
        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => fetchGems({ forceRefresh: true })}
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03E – Resultater
        ------------------------------------------------------------ */}
        {!loading && !error && gems.length > 0 && (
          <div className="space-y-4">
            {gems.map((gem) => (
              <PlaceCard key={`${gem.type}_${gem.id}`} element={gem} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03F – Empty state
        ------------------------------------------------------------ */}
        {!loading && !error && gems.length === 0 && (
          <EmptyState
            title="Ingen skjulte perler fundet"
            message="Tryk 'Søg igen' eller prøv at øge afstanden."
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 03G – Datakilde
        ------------------------------------------------------------ */}
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

      {/* ------------------------------------------------------------
         AFSNIT 03H – Debug (kan senere fjernes i production)
      ------------------------------------------------------------ */}
      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 04 – Export wrapper med TripGuard
// ============================================================================
export default function HiddenGems() {
  return (
    <TripGuard>
      <HiddenGemsContent />
    </TripGuard>
  );
}
