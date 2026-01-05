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

// ============================================================================
// AFSNIT 01 – Typer & konstanter
// ============================================================================
type Scope = "nearby" | "dk";

const RADIUS_OPTIONS_KM = [2, 4, 6, 10, 20] as const;
type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];

function toMeters(km: number) {
  return Math.round(km * 1000);
}

// ============================================================================
// AFSNIT 02 – Overpass query builder (Seværdigheder)
// NOTE: scope="dk" begrænser til Danmarks land-område via ISO-kode.
// ============================================================================
function buildTouristSpotsQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
  scope: Scope
) {
  const dkArea = `
area["ISO3166-1"="DK"][admin_level=2]->.dk;
`;

  // Hvis vi vil låse til DK, tilføjer vi (area.dk) på hver nwr(...)
  const areaFilter = scope === "dk" ? "(area.dk)" : "";

  return `
[out:json][timeout:25];
${scope === "dk" ? dkArea : ""}
(
  nwr(around:${radiusMeters},${lat},${lon})["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["historic"]${areaFilter};
  nwr(around:${radiusMeters},${lat},${lon})["leisure"="park"]${areaFilter};
);
out center tags;
`;
}

// ============================================================================
// AFSNIT 03 – Hovedkomponent (Content)
// ============================================================================
function TouristSpotsContent() {
  const { trip } = useTrip();

  // --------------------------------------------------------------------------
  // AFSNIT 03A – State
  // --------------------------------------------------------------------------
  const [spots, setSpots] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(toMeters(6));

  // Valg: nærområde eller kun Danmark (gemmes lokalt)
  const [scope, setScope] = useState<Scope>(() => {
    const saved = window.localStorage.getItem("nv_spots_scope");
    return saved === "dk" ? "dk" : "nearby";
  });

  // Valg: basis-radius (km) (gemmes lokalt)
  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() => {
    const saved = Number(window.localStorage.getItem("nv_spots_radius_km"));
    if (RADIUS_OPTIONS_KM.includes(saved as RadiusKm)) return saved as RadiusKm;
    return 6;
  });

  // --------------------------------------------------------------------------
  // AFSNIT 03B – Fetch funktion (med forceRefresh)
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

      // Cache-nøgle afhænger af scope + radius, så vi ikke blander data
      const cacheKey = getCacheKey(
        lat,
        lon,
        `tourist-spots-${scope}-r${baseRadiusKm}km`
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
      // (så København stadig får masser, men Helsingør kan udvide lidt hvis nødvendigt)
      const baseMeters = toMeters(baseRadiusKm);
      const radiusSteps = Array.from(
        new Set([baseMeters, Math.max(12000, baseMeters * 2), 20000])
      ).sort((a, b) => a - b);

      for (const radiusMeters of radiusSteps) {
        const query = buildTouristSpotsQuery(lat, lon, radiusMeters, scope);
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
    [trip.location, scope, baseRadiusKm]
  );

  // --------------------------------------------------------------------------
  // AFSNIT 03C – Auto-fetch på load / når scope/radius ændres
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // --------------------------------------------------------------------------
  // AFSNIT 03D – Status til statusbaren
  // --------------------------------------------------------------------------
  const status = loading ? "loading" : spots.length > 0 ? "done" : "empty";

  // ========================================================================
  // AFSNIT 04 – UI
  // ========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 04A – Info + kontroller (afstand + land)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {Math.round(radiusUsedMeters / 1000)} km fra centrum.
              </p>

              {/* Kontroller */}
              <div className="mt-3 grid grid-cols-1 gap-3">
                {/* Afstand */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-muted-foreground" htmlFor="radius">
                    Afstand:
                  </label>

                  <select
                    id="radius"
                    className="w-52 rounded-lg border bg-background px-3 py-2 text-sm"
                    value={baseRadiusKm}
                    onChange={(e) => {
                      const next = Number(e.target.value) as RadiusKm;
                      setBaseRadiusKm(next);
                      window.localStorage.setItem(
                        "nv_spots_radius_km",
                        String(next)
                      );
                      // Skift radius => hent nye data nu (force refresh)
                      setTimeout(() => fetchSpots({ forceRefresh: true }), 0);
                    }}
                  >
                    {RADIUS_OPTIONS_KM.map((km) => (
                      <option key={km} value={km}>
                        {km} km
                      </option>
                    ))}
                  </select>
                </div>

                {/* Landescope */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-muted-foreground" htmlFor="scope">
                    Område:
                  </label>

                  <select
                    id="scope"
                    className="w-52 rounded-lg border bg-background px-3 py-2 text-sm"
                    value={scope}
                    onChange={(e) => {
                      const next = e.target.value === "dk" ? "dk" : "nearby";
                      setScope(next);
                      window.localStorage.setItem("nv_spots_scope", next);
                      // Skift scope => hent nye data nu (force refresh)
                      setTimeout(() => fetchSpots({ forceRefresh: true }), 0);
                    }}
                  >
                    <option value="nearby">Nærområde (kan krydse grænser)</option>
                    <option value="dk">Kun Danmark</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 04B – Status + Søg igen (force refresh)
        ------------------------------------------------------------ */}
        <SearchStatusBar
          status={status}
          onRetry={() => fetchSpots({ forceRefresh: true })}
        />

        {/* ------------------------------------------------------------
           AFSNIT 04C – Loading (skeletons)
        ------------------------------------------------------------ */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 04D – Error state
        ------------------------------------------------------------ */}
        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => fetchSpots({ forceRefresh: true })}
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 04E – Resultater
        ------------------------------------------------------------ */}
        {!loading && !error && spots.length > 0 && (
          <div className="space-y-4">
            {spots.map((spot) => (
              <PlaceCard key={`${spot.type}_${spot.id}`} element={spot} />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 04F – Empty state
        ------------------------------------------------------------ */}
        {!loading && !error && spots.length === 0 && (
          <EmptyState
            title="Ingen seværdigheder fundet"
            message="Tryk 'Søg igen' eller prøv at øge afstanden."
          />
        )}

        {/* ------------------------------------------------------------
           AFSNIT 04G – Datakilde
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
         AFSNIT 04H – Debug (kan senere fjernes i production)
      ------------------------------------------------------------ */}
      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 05 – Export wrapper med TripGuard
// ============================================================================
export default function TouristSpots() {
  return (
    <TripGuard>
      <TouristSpotsContent />
    </TripGuard>
  );
}
