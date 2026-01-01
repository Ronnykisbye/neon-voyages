import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { loadTripData, type TripData } from "@/services/storage";
import { getGoogleMapsUrl } from "@/services/geocoding";

interface HiddenGem {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  category?: string;
}

export default function HiddenGems() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
    fetchGems(data);
  }, [navigate]);

  const fetchGems = async (data: TripData) => {
    if (!data.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    try {
      // Look for viewpoints, artwork, and less common attractions
      const radius = 15000; // 15km radius
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"="viewpoint"](around:${radius},${data.location.lat},${data.location.lon});
          node["tourism"="artwork"](around:${radius},${data.location.lat},${data.location.lon});
          node["natural"="cave_entrance"](around:${radius},${data.location.lat},${data.location.lon});
          node["leisure"="garden"](around:${radius},${data.location.lat},${data.location.lon});
          node["historic"="ruins"](around:${radius},${data.location.lat},${data.location.lon});
          node["natural"="spring"](around:${radius},${data.location.lat},${data.location.lon});
        );
        out 15;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (!response.ok) {
        throw new Error("Kunne ikke hente skjulte perler");
      }

      const json = await response.json();
      const results: HiddenGem[] = json.elements
        .filter((el: any) => el.tags?.name)
        .slice(0, 12)
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags.name,
          description: el.tags.description,
          lat: el.lat,
          lon: el.lon,
          category:
            el.tags.tourism ||
            el.tags.natural ||
            el.tags.leisure ||
            el.tags.historic,
        }));

      setGems(results);
    } catch (err) {
      console.error("Error fetching hidden gems:", err);
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Skjulte perler" subtitle={tripData.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard padding="sm">
          <p className="text-sm text-muted-foreground">
            Unikke steder fra OpenStreetMap - udsigter, kunst, haver og ruiner
          </p>
        </NeonCard>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Finder skjulte perler..." />
          </div>
        )}

        {error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <p className="text-destructive">{error}</p>
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
                Ingen skjulte perler fundet i nærheden.
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
