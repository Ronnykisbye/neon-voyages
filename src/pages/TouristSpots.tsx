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

type Scope = "nearby" | "dk";

/* ---------- Overpass query ---------- */
function buildTouristSpotsQuery(lat: number, lon: number, radius: number, scope: Scope) {
  // Når scope = "dk", begrænser vi til Danmarks land-område i OSM
  const dkArea = `
area["ISO3166-1"="DK"][admin_level=2]->.dk;
`;

  const areaFilter = scope === "dk" ? `(area.dk)` : "";

  return `
[out:json][timeout:25];
${scope === "dk" ? dkArea : ""}
(
  nwr(around:${radius},${lat},${lon})["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"]${areaFilter};
  nwr(around:${radius},${lat},${lon})["historic"]${areaFilter};
  nwr(around:${radius},${lat},${lon})["leisure"="park"]${areaFilter};
);
out center tags;
`;
}

function TouristSpotsContent() {
  const { trip } = useTrip();

  const [spots, setSpots] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  // Valg: nærområde eller kun Danmark (gemmes lokalt)
  const [scope, setScope] = useState<Scope>(() => {
    const saved = window.localStorage.getItem("nv_spots_scope");
    return saved === "dk" ? "dk" : "nearby";
  });

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

      // Cache-nøgle afhænger også af scope, ellers får du “forkerte” cached resultater
      const cacheKey = getCacheKey(lat, lon, `tourist-spots-${scope}`);

      // Brug cache – men spring over ved “Søg igen”
      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setSpots(cached);
          setLoading(false);
          return;
        }
      }

      const radiusSteps = [6000, 12000, 20000];

      for (const radius of radiusSteps) {
        const query = buildTouristSpotsQuery(lat, lon, radius, scope);
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
          setSpots(sliced);
          setRadiusUsed(radius);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setSpots([]);
      setLoading(false);
    },
    [trip.location, scope]
  );

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const status = loading ? "loading" : spots.length > 0 ? "done" : "empty";

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Viser seværdigheder inden for {radiusUsed / 1000} km fra centrum. Data fra OpenStreetMap (gratis, ingen API-nøgle).
              </p>

              {/* Scope valg */}
              <div className="mt-3 flex items-center justify-between gap-3">
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
                    // Skift scope => hent nye data (force refresh)
                    // (vi venter ikke på useEffect alene, så det føles instant)
                    setTimeout(() => fetchSpots({ forceRefresh: true }), 0);
                  }}
                >
                  <option value="nearby">Nærområde (kan krydse grænser)</option>
                  <option value="dk">Kun Danmark</option>
                </select>
              </div>
            </div>
          </div>
        </NeonCard>

        <SearchStatusBar
          status={status}
          onRetry={() => fetchSpots({ forceRefresh: true })}
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
            onRetry={() => fetchSpots({ forceRefresh: true })}
          />
        )}

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
