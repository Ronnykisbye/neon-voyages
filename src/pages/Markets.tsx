import React, { useEffect, useState, useCallback } from "react";
import { ShoppingBag, ExternalLink, RefreshCw } from "lucide-react";
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

interface Market {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  category?: string;
}

function MarketsContent() {
  const { trip } = useTrip();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!trip.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { lat, lon } = trip.location;
    const cacheKey = getCacheKey(lat, lon, "markets");
    
    const cached = getFromCache<Market[]>(cacheKey);
    if (cached) {
      setMarkets(cached);
      setLoading(false);
      return;
    }

    const radiusSteps = [10000, 20000, 30000];
    
    for (const radius of radiusSteps) {
      try {
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="marketplace"](around:${radius},${lat},${lon});
            node["shop"="marketplace"](around:${radius},${lat},${lon});
            way["amenity"="marketplace"](around:${radius},${lat},${lon});
          );
          out center 30;
        `;

        const response = await fetchWithFallback(OVERPASS_ENDPOINTS, query);
        if (!response.ok) continue;

        const json = await response.json();
        const results: Market[] = json.elements
          .filter((el: any) => el.tags?.name)
          .slice(0, 15)
          .map((el: any) => ({
            id: String(el.id),
            name: el.tags.name,
            description: el.tags.description || el.tags.opening_hours,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            category: el.tags.market || "Marked",
          }));

        if (results.length >= 3 || radius === radiusSteps[radiusSteps.length - 1]) {
          setMarkets(results);
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

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Markeder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Lokale markeder og boder fra OpenStreetMap
          </p>
        </NeonCard>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <AttractionSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-destructive text-center">{error}</p>
              <NeonButton variant="outline" size="sm" onClick={fetchMarkets} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Prøv igen
              </NeonButton>
            </div>
          </NeonCard>
        )}

        {!loading && !error && markets.length > 0 && (
          <div className="space-y-4">
            {markets.map((market) => (
              <ResultCard
                key={market.id}
                title={market.name}
                description={market.description}
                address={market.category}
                sourceUrl={`https://www.openstreetmap.org/node/${market.id}`}
                mapsUrl={getGoogleMapsUrl(market.lat, market.lon, market.name)}
              />
            ))}
          </div>
        )}

        {!loading && !error && markets.length === 0 && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">Ingen markeder fundet i nærheden.</p>
            </div>
          </NeonCard>
        )}

        <NeonCard padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kilder</span>
            <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
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

export default function Markets() {
  return (
    <TripGuard>
      <MarketsContent />
    </TripGuard>
  );
}
