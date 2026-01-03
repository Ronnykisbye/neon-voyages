import React, { useState, useCallback } from "react";
import { Utensils, Coffee, Sun, Moon, ExternalLink, RefreshCw } from "lucide-react";
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
  buildFoodQuery
} from "@/services/overpass";

const mealCategories: Record<MealType, { icon: React.ReactNode; label: string; description: string }> = {
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

function FoodContent() {
  const { trip } = useTrip();
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [places, setPlaces] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async (meal: MealType) => {
    if (!trip.location) return;

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, `food-${meal}`);
    
    // Check cache first (30 min TTL)
    const cached = getFromCache<OverpassElement[]>(cacheKey);
    if (cached) {
      setPlaces(cached);
      setLoading(false);
      return;
    }

    // Try with increasing radius: 3km, 6km, 10km
    const radiusSteps = [3000, 6000, 10000];
    
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

      const results = (result.data || []).filter(el => el.tags?.name);

      if (results.length >= 5 || radius === radiusSteps[radiusSteps.length - 1]) {
        setPlaces(results.slice(0, 30));
        // Cache for 30 minutes
        const cacheEntry = { data: results.slice(0, 30), timestamp: Date.now() };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch {}
        setLoading(false);
        return;
      }
    }

    setError("Overpass er travl lige nu – prøv igen om lidt");
    setLoading(false);
  }, [trip.location]);

  const handleMealSelect = (meal: MealType) => {
    setMealType(meal);
    fetchPlaces(meal);
  };

  const handleRetry = () => {
    if (mealType) {
      fetchPlaces(mealType);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Spisesteder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* Meal Type Selection */}
        <div className="grid grid-cols-2 gap-3">
          {(["breakfast", "lunch", "dinner", "all"] as MealType[]).map((type) => (
            <NeonButton
              key={type}
              variant={mealType === type ? "default" : "menu"}
              size="default"
              onClick={() => handleMealSelect(type)}
              className="flex-col gap-1 h-auto py-4"
            >
              {mealCategories[type].icon}
              <span className="text-sm font-medium">{mealCategories[type].label}</span>
              <span className="text-xs text-muted-foreground">{mealCategories[type].description}</span>
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
          <ErrorState message={error} onRetry={handleRetry} />
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
            message={`Ingen ${mealCategories[mealType].label.toLowerCase()} steder fundet. Prøv at vælge en anden kategori eller et mere centralt område.`}
          />
        )}

        {mealType && (
          <NeonCard padding="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kilder</span>
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

export default function Food() {
  return (
    <TripGuard>
      <FoodContent />
    </TripGuard>
  );
}
