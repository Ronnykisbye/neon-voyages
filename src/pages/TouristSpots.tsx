import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { loadTripData, type TripData } from "@/services/storage";
import { getGoogleMapsUrl } from "@/services/geocoding";

interface Place {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  category?: string;
}

export default function TouristSpots() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
    fetchPlaces(data);
  }, [navigate]);

  const fetchPlaces = async (data: TripData) => {
    if (!data.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    try {
      // Using Overpass API (OpenStreetMap) - free, no API key required
      const radius = 10000; // 10km radius
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"="attraction"](around:${radius},${data.location.lat},${data.location.lon});
          node["tourism"="museum"](around:${radius},${data.location.lat},${data.location.lon});
          node["historic"](around:${radius},${data.location.lat},${data.location.lon});
          way["tourism"="attraction"](around:${radius},${data.location.lat},${data.location.lon});
          way["tourism"="museum"](around:${radius},${data.location.lat},${data.location.lon});
        );
        out center 20;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (!response.ok) {
        throw new Error("Kunne ikke hente seværdigheder");
      }

      const json = await response.json();
      const results: Place[] = json.elements
        .filter((el: any) => el.tags?.name)
        .slice(0, 15)
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags.name,
          description: el.tags.description || el.tags.tourism || el.tags.historic,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          category: el.tags.tourism || el.tags.historic,
        }));

      setPlaces(results);
    } catch (err) {
      console.error("Error fetching places:", err);
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={tripData.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Data fra OpenStreetMap via Overpass API (gratis, ingen API-nøgle krævet)
          </p>
        </NeonCard>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Finder seværdigheder..." />
          </div>
        )}

        {error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <p className="text-destructive">{error}</p>
          </NeonCard>
        )}

        {!loading && !error && places.length > 0 && (
          <div className="space-y-4">
            {places.map((place) => (
              <ResultCard
                key={place.id}
                title={place.name}
                description={place.description}
                address={place.category}
                sourceUrl={`https://www.openstreetmap.org/node/${place.id}`}
                mapsUrl={getGoogleMapsUrl(place.lat, place.lon, place.name)}
              />
            ))}
          </div>
        )}

        {!loading && !error && places.length === 0 && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <Landmark className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Ingen seværdigheder fundet i nærheden.
              </p>
            </div>
          </NeonCard>
        )}

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
          description="For flere og mere detaljerede resultater med billeder og anmeldelser, kan Google Places API tilføjes."
          documentationUrl="https://developers.google.com/maps/documentation/places/web-service"
        />
      </main>
    </div>
  );
}
