// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useState, useCallback, useEffect } from "react";
import { Utensils, Coffee, Sun, Moon, ExternalLink, Info } from "lucide-react";
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
  type OverpassElement,
  type MealType,
  buildFoodQuery,
} from "@/services/overpass";

// Fælles km-vælger
import SearchControls, {
  readRadiusKm,
  toMeters,
  type RadiusKm,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Konstanter & opsætning
// ============================================================================
const DEFAULT_RADIUS_KM: RadiusKm = 6;

const mealCategories: Record<
  MealType,
  { icon: React.ReactNode; label: string; description: string }
> = {
  breakfast: {
    icon: <Coffee className="h-5 w-5" />,
    label: "Morgenmad",
    description: "Caféer og bagerier",
  },
  lunch: {
    icon: <Sun className="h-5 w-5" />,
    label: "Frokost",
    description: "Caféer og restauranter",
  },
  dinner: {
    icon: <Moon className="h-5 w-5" />,
    label: "Aftensmad",
    description: "Restauranter og fast food",
  },
  all: {
    icon: <Utensils className="h-5 w-5" />,
    label: "Alle",
    description: "Alle spisesteder",
  },
};

// ============================================================================
// AFSNIT 02 – Hovedkomponent (Content)
// ============================================================================
function FoodContent() {
  const { trip } = useTrip();

  // --------------------------------------------------------------------------
  // AFSNIT 02A – State
  // --------------------------------------------------------------------------
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [places, setPlaces] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fælles radius
  const [baseRadiusKm, setBaseRadiusKm] = useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  const [radiusUsedMeters, setRadiusUsedMeters] = useState<number>(
    toMeters(baseRadiusKm)
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02B – Fetch funktion
  // --------------------------------------------------------------------------
  const fetchPlaces = useCallback(
    async (meal: MealType, opts?: { forceRefresh?: boolean }) => {
      if (!trip.location) return;

      const forceRefresh = opts?.forceRefresh === true;

      setLoading(true);
      setError(null);

      const { lat, lon } = trip.location;
      const cacheKey = getCacheKey(
        lat,
        lon,
        `food-${meal}-r${baseRadiusKm}km`
      );

      if (!forceRefresh) {
        const cached = getFromCache<OverpassElement[]>(cacheKey);
        if (cached) {
          setPlaces(cached);
          setLoading(false);
          return;
        }
      }

      const baseMeters = toMeters(baseRadiusKm);
      const radiusSteps = Array.from(
        new Set([baseMeters, Math.max(6000, baseMeters * 2), 20000])
      ).sort((a, b) => a - b);

      for (const radius of radiusSteps) {
        const query = buildFoodQuery(lat, lon, radius, meal);
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

        if (
          results.length >= 5 ||
          radius === radiusSteps[radiusSteps.length - 1]
        ) {
          const sliced = results.slice(0, 30);
          setPlaces(sliced);
          setRadiusUsedMeters(radius);
          setCache(cacheKey, sliced);
          setLoading(false);
          return;
        }
      }

      setPlaces([]);
      setLoading(false);
    },
    [trip.location, baseRadiusKm]
  );

  // --------------------------------------------------------------------------
  // AFSNIT 02C – Re-fetch når radius ændres
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (mealType) {
      fetchPlaces(mealType, { forceRefresh: true });
    }
  }, [baseRadiusKm, mealType, fetchPlaces]);

  // ========================================================================
  // AFSNIT 03 – UI
  // ========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Spisesteder" subtitle={trip.destination} />

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

              <SearchControls
                showRadius={true}
                showScope={false}
                radiusKm={baseRadiusKm}
                onRadiusChange={(km) => setBaseRadiusKm(km)}
              />
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Måltidsvalg
        ------------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-3">
          {(["breakfast", "lunch", "dinner", "all"] as MealType[]).map((type) => (
            <NeonButton
              key={type}
              variant={mealType === type ? "default" : "menu"}
              size="default"
              onClick={() => {
                setMealType(type);
                fetchPlaces(type, { forceRefresh: true });
              }}
              className="flex-col gap-1 h-auto py-4"
            >
              {mealCategories[type].icon}
              <span className="text-sm font-medium">
                {mealCategories[type].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {mealCategories[type].description}
              </span>
            </NeonButton>
          ))}
        </div>

        {!mealType && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <Utensils className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Vælg et måltid ovenfor for at se spisesteder
              </p>
            </div>
          </NeonCard>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState message={error} onRetry={() => mealType && fetchPlaces(mealType)} />
        )}

        {!loading && !error && mealType && places.length > 0 && (
          <div className="space-y-4">
            {places.map((place) => (
              <PlaceCard key={`${place.type}_${place.id}`} element={place} />
            ))}
          </div>
        )}

        {!loading && !error && mealType && places.length === 0 && (
          <EmptyState
            title="Ingen spisesteder fundet"
            message={`Ingen ${mealCategories[
              mealType
            ].label.toLowerCase()} steder fundet. Prøv at øge afstanden.`}
          />
        )}

        {mealType && (
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
        )}
      </main>

      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 04 – Export wrapper
// ============================================================================
export default function Food() {
  return (
    <TripGuard>
      <FoodContent />
    </TripGuard>
  );
}
