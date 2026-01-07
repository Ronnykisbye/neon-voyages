// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useState, useCallback } from "react";
import { ExternalLink, Utensils } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceSkeleton } from "@/components/PlaceSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { TripGuard } from "@/components/TripGuard";
import SearchStatusBar from "@/components/SearchStatusBar";
import { useTrip } from "@/context/TripContext";
import {
  queryOverpass,
  getCacheKey,
  getFromCache,
  setCache,
  type OverpassElement,
} from "@/services/overpass";

// Fælles SearchControls
import SearchControls, {
  readRadiusKm,
  readScope,
  writeScope,
  toMeters,
  type RadiusKm,
  type Scope,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Konstanter
// ============================================================================
const DEFAULT_RADIUS_KM: RadiusKm = 6;

// ============================================================================
// AFSNIT 02 – Helpers
// ============================================================================
function getTripCountryCode(trip: any): string | undefined {
  const cc =
    trip?.location?.countryCode ||
    trip?.countryCode ||
    trip?.location?.country_code;
  return typeof cc === "string" ? cc.toLowerCase() : undefined;
}

// ============================================================================
// AFSNIT 03 – Overpass query (Food)
// ============================================================================
function buildFoodQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
  scope: Scope,
  countryCodeLower?: string
) {
  const wantsDK = scope === "dk";
  const wantsCountry = scope === "country" && !!countryCodeLower;

  const iso = wantsDK
    ? "DK"
    : wantsCountry
      ? countryCodeLower.toUpperCase()
      : "";

  const areaDef = iso
    ? `
area["ISO3166-1"="${iso}"][admin_level=2]->.countryArea;
`
    : "";

  const areaFilter = iso ? "(area.countryArea)" : "";

  return `
[out:json][timeout:25];
${areaDef}
(
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="restaurant"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="cafe"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="fast_food"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="bar"]${areaFilter};
);
out center tags;
`;
}

// ============================================================================
// AFSNIT 04 – Content
// ============================================================================
function FoodContent() {
  const { trip } = useTrip();

  const [items, setItems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );
  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(
    toMeters(baseRadiusKm)
  );

  const [scope, setScope] = useState<Scope>(() => readScope("nearby"));

  // --------------------------------------------------------------------------
  // Auto-fallback: DK → nearby i udlandet
  // --------------------------------------------------------------------------
  useEffect(() => {
    const cc = getTripCountryCode(trip);
    if (scope === "dk" && cc && cc !== "dk") {
      setScope("nearby");
      writeScope("nearby");
    }
  }, [trip, scope]);

  // --------------------------------------------------------------------------
  // Fetch
  // --------------------------------------------------------------------------
  const fetchFood = useCallback(
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
      const countryCodeLower = getTripCountryCode(trip);

      const safeScope: Scope =
        scope === "dk" && countryCodeLower && countryCodeLower !== "dk"
          ? "nearby"
          : scope === "country" && !countryCodeLower
            ? "nearby"
            : scope;

      const scopeKey =
        safeScope === "country" ? `country-${countryCodeLower}` : safeScope;

      const cacheKey = getCacheKey(
        lat,
        lon,
        `food-${scopeKey}-r${baseRadiusKm}km`
      );

      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setItems(cached);
          setLoading(false);
          return;
        }
      }

      const baseMeters = toMeters(baseRadiusKm);
      const radiusSteps = Array.from(
        new Set([baseMeters, Math.max(12000, baseMeters * 2), 20000])
      ).sort((a, b) => a - b);

      for (const radiusMeters of radiusSteps) {
        const query = buildFoodQuery(
          lat,
          lon,
          radiusMeters,
          safeScope,
          countryCodeLower
        );

        const result = await queryOverpass(query);

        if (result.error) {
          if (radiusMeters === radiusSteps[radiusSteps.length - 1]) {
            setError(result.error);
            setLoading(false);
            return;
          }
          continue;
        }

        const results = (result.data || []).filter((el) => el.tags?.name);

        if (
          results.length >= 8 ||
          radiusMeters === radiusSteps[radiusSteps.length - 1]
        ) {
          const sliced = results.slice(0, 30);
          setItems(sliced);
          setRadiusUsedMeters(radiusMeters);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setItems([]);
      setLoading(false);
    },
    [trip, scope, baseRadiusKm]
  );

  useEffect(() => {
    fetchFood();
  }, [fetchFood]);

  const status = loading ? "loading" : items.length > 0 ? "done" : "empty";

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Spisesteder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Utensils className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {Math.round(radiusUsedMeters / 1000)} km fra centrum.
              </p>

              <div className="mt-3">
                <SearchControls
                  showRadius
                  showScope
                  radiusKm={baseRadiusKm}
                  scope={scope}
                  onRadiusChange={(km) => {
                    setBaseRadiusKm(km);
                    setTimeout(() => fetchFood({ forceRefresh: true }), 0);
                  }}
                  onScopeChange={(next) => {
                    setScope(next);
                    writeScope(next);
                    setTimeout(() => fetchFood({ forceRefresh: true }), 0);
                  }}
                />
              </div>
            </div>
          </div>
        </NeonCard>

        <SearchStatusBar
          status={status}
          onRetry={() => fetchFood({ forceRefresh: true })}
        />

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => fetchFood({ forceRefresh: true })}
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((el) => (
              <PlaceCard key={`${el.type}_${el.id}`} element={el} />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="Ingen spisesteder fundet"
            message="Tryk 'Søg igen' eller prøv at øge afstanden."
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
    </div>
  );
}

// ============================================================================
// AFSNIT 05 – Export
// ============================================================================
export default function Food() {
  return (
    <TripGuard>
      <FoodContent />
    </TripGuard>
  );
}
