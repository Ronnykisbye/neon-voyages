import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, RefreshCw, ExternalLink, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { AttractionCard } from "@/components/AttractionCard";
import { AttractionSkeleton } from "@/components/AttractionSkeleton";
import { loadTripData, type TripData } from "@/services/storage";
import { fetchAttractions, type AttractionResult } from "@/services/overpass";

export default function TouristSpots() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [attractions, setAttractions] = useState<AttractionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusUsed, setRadiusUsed] = useState<number>(6000);

  const loadAttractions = useCallback(async (data: TripData) => {
    if (!data.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchAttractions(data.location.lat, data.location.lon);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setAttractions(result.data);
      setRadiusUsed(result.radiusUsed);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
    loadAttractions(data);
  }, [navigate, loadAttractions]);

  const handleRetry = () => {
    if (tripData) {
      loadAttractions(tripData);
    }
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Seværdigheder" subtitle={tripData.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* Info card */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Viser seværdigheder inden for {radiusUsed / 1000} km fra centrum. 
              Data fra OpenStreetMap (gratis, ingen API-nøgle).
            </p>
          </div>
        </NeonCard>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <AttractionSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state with retry */}
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

        {/* Results */}
        {!loading && !error && attractions.length > 0 && (
          <div className="space-y-4">
            {attractions.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && attractions.length === 0 && (
          <NeonCard>
            <div className="flex flex-col items-center gap-4 py-6">
              <Landmark className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Ingen seværdigheder fundet inden for {radiusUsed / 1000} km.
                </p>
                <p className="text-sm text-muted-foreground/70">
                  OpenStreetMap har muligvis ikke detaljerede data for dette område.
                  Prøv at søge på et mere centralt punkt, eller brug Google Maps direkte.
                </p>
              </div>
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

        {/* Source attribution */}
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
              © OpenStreetMap bidragydere
            </a>
          </div>
        </NeonCard>
      </main>
    </div>
  );
}
