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
  type OverpassElement,
} from "@/services/overpass";

// ✅ Fælles kontrol-komponent (km + scope)
//    (vigtigt: vi bruger nu samme scope-logik som resten af appen)
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
// AFSNIT 02 – Små helpers (landkode fra TripContext)
// ============================================================================
function getTripCountryCode(trip: any): string | undefined {
  const cc =
    trip?.location?.countryCode ||
    trip?.countryCode ||
    trip?.location?.country_code; // (ekstra defensivt, hvis noget ændrer sig)
  return typeof cc === "string" ? cc.toLowerCase() : undefined;
}

// ============================================================================
// AFSNIT 03 – Overpass query builder (Seværdigheder)
// NOTE:
// - scope="dk" låser til DK
// - scope="country" låser til destinationens land (ISO3166-1 alpha2)
// - scope="nearby" søger uden land-lås (kan krydse grænser)
// ============================================================================
function buildTouristSpotsQuery(
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
      ? String(countryCodeLower).toUpperCase()
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
  nwr(around:${radiusMeters},${lat},${lon})["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["historic"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["leisure"="park"]${areaFilter};
);
out center tags;
`;
}

// ============================================================================
// AFSNIT 04 – Hovedkomponent (Content)
// ============================================================================
function TouristSpotsContent() {
  const { trip } = useTrip();

  // --------------------------------------------------------------------------
  // AFSNIT 04A – State
  // --------------------------------------------------------------------------
  const [spots, setSpots] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fælles radius-setting (gemmes i localStorage via SearchControls)
  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  // Hvad vi endte med at søge i (kan udvide automatisk hvis få resultater)
  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(
    toMeters(baseRadiusKm)
  );

  // ✅ Fælles scope-setting (læser også legacy nv_spots_scope via SearchControls)
  const [scope, setScope] = useState<Scope>(() => readScope("nearby"));

  // --------------------------------------------------------------------------
  // AFSNIT 04B – Auto-fallback: hvis scope=dk men destination ikke er DK
  // --------------------------------------------------------------------------
  useEffect(() => {
    const cc = getTripCountryCode(trip);
    const isDK = cc === "dk";

    if (scope === "dk" && cc && !isDK) {
      // Hvis brugeren står i udlandet og scope står på DK → skift sikkert til nearby
      setScope("nearby");
      writeScope("nearby"); // skriver også legacy nv_spots_scope
    }
  }, [trip, scope]);

  // --------------------------------------------------------------------------
  // AFSNIT 04C – Fetch funktion (med forceRefresh)
  // --------------------------------------------------------------------------
  const fetchSpots = useCallback(
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

      // Sikker scope til query:
      // - dk i udlandet => nearby
      // - country uden landkode => nearby
      const safeScope: Scope =
        scope === "dk" && countryCodeLower && countryCodeLower !== "dk"
          ? "nearby"
          : scope === "country" && !countryCodeLower
            ? "nearby"
            : scope;

      // Cache-nøgle afhænger af scope + radius (+ land ved country),
      // så vi ikke blander data mellem lande.
      const scopeKey =
        safeScope === "country" ? `country-${countryCodeLower}` : safeScope;

      const cacheKey = getCacheKey(
        lat,
        lon,
        `tourist-spots-${scopeKey}-r${baseRadiusKm}km`
      );

      // Cache først – men ikke hvis brugeren trykker “Søg igen”
      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setSpots(cached);
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
        const query = buildTouristSpotsQuery(
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
          results.length >= 10 ||
          radiusMeters === radiusSteps[radiusSteps.length - 1]
        ) {
          const sliced = results.slice(0, 30);
          setSpots(sliced);
          setRadiusUsedMeters(radiusMeters);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setSpots([]);
      setLoading(false);
    },
    [trip, scope, baseRadiusKm]
  );

  // --------------------------------------------------------------------------
  // AFSNIT 04D – Auto-fetch på load / når scope/radius ændres
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // --------------------------------------------------------------------------
  // AFSNIT 04E – Status til statusbaren
  // --------------------------------------------------------------------------
  const status = loading ? "loading" : spots.length > 0 ? "done" : "empty";

  // ==========================================================================
  // AFSNIT 05 – UI
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 05A – Info + kontroller (km + scope)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {Math.round(radiusUsedMeters / 1000)} km fra centrum.
              </p>

              {/* ✅ Fælles kontrol: radius + scope (country-aware + fallback) */}
              <div className="mt-3">
                <SearchControls
                  showRadius={true}
                  showScope={true}
                  radiusKm={baseRadiusKm}
                  scope={scope}
                  onRadiusChange={(km) => {
                    setBaseRadiusKm(km);
                    setTimeout(() => fetchSpots({ forceRefresh: true }), 0);
                  }}
                  onScopeChange={(next) => {
                    setScope(next);
                    writeScope(next); // skriver også legacy nv_spots_scope
                    setTimeout(() => fetchSpots({ forceRefresh: true }), 0);
                  }}
                />
              </div>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 05B – Status + Søg igen (force refresh)
        ------------------------------------------------------------ */}
        <SearchStatusBar
          status={status}
          onRetry={() => fetchSpots({ forceRefresh: true })}
        />

        {/* ------------------------------------------------------------
           AFSNIT 05C – Loading (skeletons)
        ------------------------------------------------------------ */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 05D – Error state
        ------------------------------------------------------------ */}
        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => fetchSpots({ forceRefresh: true })}
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 05E – Resultater
        ------------------------------------------------------------ */}
        {!loading && !error && spots.length > 0 && (
          <div className="space-y-4">
            {spots.map((spot) => (
              <PlaceCard key={`${spot.type}_${spot.id}`} element={spot} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 05F – Empty state
        ------------------------------------------------------------ */}
        {!loading && !error && spots.length === 0 && (
          <EmptyState
            title="Ingen seværdigheder fundet"
            message="Tryk 'Søg igen' eller prøv at øge afstanden."
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 05G – Datakilde
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
         AFSNIT 05H – Debug (kan senere fjernes i production)
      ------------------------------------------------------------ */}
      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 06 – Export wrapper med TripGuard
// ============================================================================
export default function TouristSpots() {
  return (
    <TripGuard>
      <TouristSpotsContent />
    </TripGuard>
  );
}
