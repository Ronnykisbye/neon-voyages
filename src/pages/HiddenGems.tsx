import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, ExternalLink, RefreshCw } from "lucide-react";
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

interface HiddenGem {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  category?: string;
}

function HiddenGemsContent() {
  const { trip } = useTrip();
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(15000);

  const fetchGems = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "hidden-gems");
    
    // Check cache first
    const cached = getFromCache<HiddenGem[]>(cacheKey);
    if (cached) {
      setGems(cached);
      setLoading(false);
      return;
    }

    // Try with increasing radius: 15km, 25km, 40km
    const radiusSteps = [15000, 25000, 40000];
    
    for (const radius of radiusSteps) {
      try {
        const query = `
          [out:json][timeout:25];
          (
            node["tourism"="viewpoint"](around:${radius},${lat},${lon});
            node["tourism"="artwork"](around:${radius},${lat},${lon});
            node["natural"="cave_entrance"](around:${radius},${lat},${lon});
            node["leisure"="garden"](around:${radius},${lat},${lon});
            node["historic"="ruins"](around:${radius},${lat},${lon});
            node["natural"="spring"](around:${radius},${lat},${lon});
            node["tourism"="picnic_site"](around:${radius},${lat},${lon});
            node["natural"="waterfall"](around:${radius},${lat},${lon});
            way["tourism"="viewpoint"](around:${radius},${lat},${lon});
            way["leisure"="garden"](around:${radius},${lat},${lon});
            way["historic"="ruins"](around:${radius},${lat},${lon});
          );
          out center 60;
        `;

        const response = await fetchWithFallback(OVERPASS_ENDPOINTS, query);

        if (!response.ok) {
          if (response.status === 429 || response.status === 504) {
            continue; // Try next radius or endpoint
          }
          throw new Error("Kunne ikke hente skjulte perler");
        }

        const json = await response.json();
        const results: HiddenGem[] = json.elements
          .filter((el: any) => el.tags?.name)
          .slice(0, 20)
          .map((el: any) => ({
            id: String(el.id),
            name: el.tags.name,
            description: el.tags.description,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            category:
              el.tags.tourism ||
              el.tags.natural ||
              el.tags.leisure ||
              el.tags.historic,
          }));

        if (results.length >= 5 || radius === radiusSteps[radiusSteps.length - 1]) {
          setGems(results);
          setRadiusUsed(radius);
          setCache(cacheKey, results);
          setLoading(false);
          return;
        }
        // Not enough results, try larger radius
      } catch (err) {
        console.error(`Error with radius ${radius}:`, err);
        // Continue to next radius
      }
    }

    setError("Overpass er travl lige nu – prøv igen om lidt");
    setLoading(false);
  }, [trip.location]);

  useEffect(() => {
    fetchGems();
  }, [fetchGems]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Skjulte perler" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Unikke steder fra OpenStreetMap inden for {radiusUsed / 1000} km - udsigter, kunst, haver og ruiner
          </p>
        </NeonCard>

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
                onClick={fetchGems}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Prøv igen
              </NeonButton>
            </div>
          </NeonCard>
        )}

        {!loading && !error && gems.length > 0 && (
          <div className="space-y-4">
            {gems.map((gem) => (
              <ResultCard
                key={gem.id}
                title={gem.name}
                description={gem.description}
                address={gem.category}
                sourceUrl={`https://www.openstreetmap.org/node/${gem.id}`}
                mapsUrl={getGoogleMapsUrl(gem.lat, gem.lon, gem.name)}
              />
            ))}
          </div>
        )}

        {!loading && !error && gems.length === 0 && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Ingen skjulte perler fundet i nærheden. Prøv et mere centralt punkt.
              </p>
              <NeonButton
                variant="outline"
                size="sm"
                onClick={fetchGems}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Prøv igen
              </NeonButton>
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
      </main>

      <TripDebug />
    </div>
  );
}

export default function HiddenGems() {
  return (
    <TripGuard>
      <HiddenGemsContent />
    </TripGuard>
  );
}
