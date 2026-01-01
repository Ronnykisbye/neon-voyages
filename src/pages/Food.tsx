import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Utensils, Coffee, Sun, Moon, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { loadTripData, type TripData } from "@/services/storage";
import { getGoogleMapsUrl } from "@/services/geocoding";

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
    query: 'node["amenity"="cafe"](around:RADIUS,LAT,LON);node["cuisine"~"breakfast|bakery"](around:RADIUS,LAT,LON);',
  },
  lunch: {
    icon: <Sun className="h-5 w-5" />,
    label: "Frokost",
    query: 'node["amenity"="restaurant"](around:RADIUS,LAT,LON);node["amenity"="fast_food"](around:RADIUS,LAT,LON);',
  },
  dinner: {
    icon: <Moon className="h-5 w-5" />,
    label: "Aftensmad",
    query: 'node["amenity"="restaurant"](around:RADIUS,LAT,LON);',
  },
};

export default function Food() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [mealType, setMealType] = useState<MealType>(null);
  const [places, setPlaces] = useState<FoodPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
  }, [navigate]);

  const fetchPlaces = async (meal: MealType) => {
    if (!tripData?.location || !meal) return;

    setLoading(true);
    setError(null);

    try {
      const radius = 5000;
      const queryTemplate = mealCategories[meal].query
        .replace(/RADIUS/g, String(radius))
        .replace(/LAT/g, String(tripData.location.lat))
        .replace(/LON/g, String(tripData.location.lon));

      const query = `
        [out:json][timeout:25];
        (
          ${queryTemplate}
        );
        out 15;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (!response.ok) {
        throw new Error("Kunne ikke hente spisesteder");
      }

      const json = await response.json();
      const results: FoodPlace[] = json.elements
        .filter((el: any) => el.tags?.name)
        .slice(0, 12)
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags.name,
          cuisine: el.tags.cuisine,
          lat: el.lat,
          lon: el.lon,
          category: el.tags.amenity || el.tags.shop,
        }));

      setPlaces(results);
    } catch (err) {
      console.error("Error fetching food places:", err);
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  const handleMealSelect = (meal: MealType) => {
    setMealType(meal);
    if (meal) {
      fetchPlaces(meal);
    }
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Spisesteder" subtitle={tripData.destination} />

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
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Finder spisesteder..." />
          </div>
        )}

        {error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <p className="text-destructive">{error}</p>
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
            <p className="text-muted-foreground text-center">
              Ingen spisesteder fundet for {mealCategories[mealType].label.toLowerCase()}.
            </p>
          </NeonCard>
        )}

        {mealType && (
          <>
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

            <ApiKeyNotice
              apiName="Google Places API"
              description="For flere resultater med billeder, åbningstider og anmeldelser."
              documentationUrl="https://developers.google.com/maps/documentation/places/web-service"
            />
          </>
        )}
      </main>
    </div>
  );
}
