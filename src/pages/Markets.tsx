import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { loadTripData, type TripData } from "@/services/storage";
import { getGoogleMapsUrl } from "@/services/geocoding";

interface Market {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  category?: string;
}

export default function Markets() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
    fetchMarkets(data);
  }, [navigate]);

  const fetchMarkets = async (data: TripData) => {
    if (!data.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    try {
      const radius = 10000;
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="marketplace"](around:${radius},${data.location.lat},${data.location.lon});
          node["shop"="marketplace"](around:${radius},${data.location.lat},${data.location.lon});
          node["amenity"="market"](around:${radius},${data.location.lat},${data.location.lon});
          way["amenity"="marketplace"](around:${radius},${data.location.lat},${data.location.lon});
        );
        out center 15;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (!response.ok) {
        throw new Error("Kunne ikke hente markeder");
      }

      const json = await response.json();
      const results: Market[] = json.elements
        .filter((el: any) => el.tags?.name)
        .slice(0, 12)
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags.name,
          description: el.tags.description || el.tags.opening_hours,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          category: el.tags.market || "Marked",
        }));

      setMarkets(results);
    } catch (err) {
      console.error("Error fetching markets:", err);
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Markeder" subtitle={tripData.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Lokale markeder og boder fra OpenStreetMap
          </p>
        </NeonCard>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Finder markeder..." />
          </div>
        )}

        {error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <p className="text-destructive">{error}</p>
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
              <p className="text-muted-foreground text-center">
                Ingen markeder fundet i nærheden.
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
      </main>
    </div>
  );
}
