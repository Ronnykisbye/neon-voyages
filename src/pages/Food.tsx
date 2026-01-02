import React, { useState, useCallback } from "react";
import { Utensils, Coffee, Sun, Moon, ExternalLink, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ResultCard } from "@/components/ResultCard";
import { AttractionSkeleton } from "@/components/AttractionSkeleton";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";
import { getGoogleMapsUrl } from "@/services/geocoding";
import { fetchWithFallback, OVERPASS_ENDPOINTS, getCacheKey, getFromCache, setCache } from "@/services/overpass";

type MealType = "breakfast" | "lunch" | "dinner" | null;

interface FoodPlace {
  id: string;
  name: string;
  cuisine?: string;
  lat: number;
  lon: number;
  category: string;
}

const mealCategories = {
  breakfast: {
    icon: <Coffee className="h-5 w-5" />,
    label: "Morgenmad",
    tags: `
      node["amenity"="cafe"](around:RADIUS,LAT,LON);
      node["cuisine"~"breakfast|bakery"](around:RADIUS,LAT,LON);
      node["shop"="bakery"](around:RADIUS,LAT,LON);
    `,
  },
  lunch: {
    icon: <Sun className="h-5 w-5" />,
    label: "Frokost",
    tags: `
      node["amenity"="restaurant"](around:RADIUS,LAT,LON);
      node["amenity"="fast_food"](around:RADIUS,LAT,LON);
      node["amenity"="food_court"](around:RADIUS,LAT,LON);
    `,
  },
  dinner: {
    icon: <Moon className="h-5 w-5" />,
    label: "Aftensmad",
    tags: `
      node["amenity"="restaurant"](around:RADIUS,LAT,LON);
      node["amenity"="pub"](around:RADIUS,LAT,LON);
    `,
  },
};

function FoodContent() {
  const { trip } = useTrip();
  const [mealType, setMealType] = useState<MealType>(null);
  const [places, setPlaces] = useState<FoodPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async (meal: MealType) => {
    if (!trip.location || !meal) return;

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, `food-${meal}`);
    
    // Check cache first
    const cached = getFromCache<FoodPlace[]>(cacheKey);
    if (cached) {
      setPlaces(cached);
      setLoading(false);
      return;
    }

    // Try with increasing radius: 3km, 6km, 10km
    const radiusSteps = [3000, 6000, 10000];
    
    for (const radius of radiusSteps) {
      try {
        const queryTags = mealCategories[meal].tags
          .replace(/RADIUS/g, String(radius))
          .replace(/LAT/g, String(lat))
          .replace(/LON/g, String(lon));

        const query = `
          [out:json][timeout:25];
          (
            ${queryTags}
          );
          out 40;
        `;

        const response = await fetchWithFallback(OVERPASS_ENDPOINTS, query);

        if (!response.ok) {
          if (response.status === 429 || response.status === 504) {
            continue;
          }
          throw new Error("Kunne ikke hente spisesteder");
        }

        const json = await response.json();
        const results: FoodPlace[] = json.elements
          .filter((el: any) => el.tags?.name)
          .slice(0, 20)
          .map((el: any) => ({
            id: String(el.id),
            name: el.tags.name,
            cuisine: el.tags.cuisine,
            lat: el.lat,
            lon: el.lon,
            category: el.tags.amenity || el.tags.shop || "Spisested",
          }));

        if (results.length >= 5 || radius === radiusSteps[radiusSteps.length - 1]) {
          setPlaces(results);
          setCache(cacheKey, results);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error(`Error with radius ${radius}:`, err);
      }
    }

    setError("Overpass er travl lige nu – prøv igen om lidt");
    setLoading(false);
  }, [trip.location]);

  const handleMealSelect = (meal: MealType) => {
    setMealType(meal);
    if (meal) {
      fetchPlaces(meal);
    }
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
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(mealCategories) as MealType[]).filter(Boolean).map((type) => (
            <NeonButton
              key={type}
              variant={mealType === type ? "default" : "menu"}
              size="default"
              onClick={() => handleMealSelect(type)}
              className="flex-col gap-1 h-auto py-4"
            >
              {mealCategories[type!].icon}
              <span className="text-sm">{mealCategories[type!].label}</span>
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
              <AttractionSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-destructive text-center">{error}</p>
              <NeonButton
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Prøv igen
              </NeonButton>
            </div>
          </NeonCard>
        )}

        {!loading && !error && mealType && places.length > 0 && (
          <div className="space-y-4">
            {places.map((place) => (
              <ResultCard
                key={place.id}
                title={place.name}
                description={place.cuisine}
                address={place.category}
                sourceUrl={`https://www.openstreetmap.org/node/${place.id}`}
                mapsUrl={getGoogleMapsUrl(place.lat, place.lon, place.name)}
              />
            ))}
          </div>
        )}

        {!loading && !error && mealType && places.length === 0 && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <Utensils className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Ingen spisesteder fundet for {mealCategories[mealType].label.toLowerCase()}.
              </p>
              <NeonButton
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Prøv igen
              </NeonButton>
            </div>
          </NeonCard>
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
