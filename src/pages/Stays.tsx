import { useMemo, useState } from "react";
import { BedDouble, LocateFixed, MapPin, Search, Utensils } from "lucide-react";
import { DestinationInput } from "@/components/DestinationInput";
import { PageHeader } from "@/components/PageHeader";
import { StayResultCard } from "@/components/StayResultCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { useTrip } from "@/context/TripContext";
import type { LocationResult } from "@/services/geocoding";
import {
  hasGooglePlacesProxy,
  searchGooglePlaces,
  searchOpenStreetMapPlaces,
  type PlaceResult,
} from "@/services/places";
import type { StayCategory } from "@/services/overpass";
import { cn } from "@/lib/utils";
import { FOOD_TYPES, type FoodType } from "@/data/foodTypes";
import { PacmanLoader } from "@/components/PacmanLoader";

const RADII = [3, 5, 10] as const;

export default function Stays() {
  const { trip } = useTrip();
  const [category, setCategory] = useState<StayCategory>("restaurant");
  const [radiusKm, setRadiusKm] = useState<(typeof RADII)[number]>(5);
  const [foodType, setFoodType] = useState<FoodType>("all");
  const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationResult | undefined>(trip.location);
  const [locationText, setLocationText] = useState(trip.destination || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const googleReady = useMemo(() => hasGooglePlacesProxy(), []);
  const selectedFoodLabel = FOOD_TYPES.find((type) => type.id === foodType)?.label;

  const surpriseMe = () => {
    const choices = FOOD_TYPES.filter((type) => type.id !== "all");
    const choice = choices[Math.floor(Math.random() * choices.length)];
    setFoodType(choice.id);
    setResults([]);
    setSurpriseMessage(`${choice.emoji} Vi leder efter ${choice.label.toLowerCase()} mad!`);
  };

  const handleDestination = (value: string, selected?: LocationResult) => {
    setLocationText(value);
    setLocation(selected);
    setResults([]);
  };

  const useGps = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Denne browser understøtter ikke lokation.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          id: "gps-search",
          name: "Min lokation",
          displayName: "Min aktuelle lokation",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          type: "gps",
        });
        setLocationText("Min aktuelle lokation");
        setResults([]);
        setGpsLoading(false);
      },
      (gpsError) => {
        setError(gpsError.code === 1 ? "Du skal give tilladelse til lokation for at bruge GPS." : "GPS-positionen kunne ikke findes.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 }
    );
  };

  const search = async () => {
    if (!location) {
      setError("Vælg en by fra listen eller brug din GPS først.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    setVisibleCount(10);
    try {
      if (googleReady) {
        try {
          const googleResults = await searchGooglePlaces(
            location.lat,
            location.lon,
            radiusKm * 1000,
            category,
            foodType
          );
          setResults(googleResults);
          if (googleResults.length === 0) setNotice("Google fandt ingen steder med de valgte filtre.");
          return;
        } catch (googleError) {
          console.warn("Google Places fallback:", googleError);
          setNotice("Google kunne ikke svare. Du ser derfor den gratis OpenStreetMap-reserve.");
        }
      } else {
        setNotice("Google-delen afprøves først, når den beskyttede API-nøgle er tilsluttet. Du ser OpenStreetMap-resultater nu.");
      }

      const osmResults = await searchOpenStreetMapPlaces(
        location.lat,
        location.lon,
        radiusKm * 1000,
        category,
        foodType
      );
      setResults(osmResults);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Søgningen fejlede. Prøv igen.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Find dit næste sted" subtitle="Hoteller og restauranter med dokumenterede scores" />

        <main className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit space-y-5 rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-card backdrop-blur-xl lg:sticky lg:top-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5">
              {(["restaurant", "hotel"] as StayCategory[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setCategory(item); setResults([]); }}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                    category === item ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item === "restaurant" ? <Utensils className="h-4 w-4" /> : <BedDouble className="h-4 w-4" />}
                  {item === "restaurant" ? "Restaurant" : "Hotel"}
                </button>
              ))}
            </div>

            <section className="space-y-2">
              <label className="text-sm font-semibold">Hvor vil du søge?</label>
              <DestinationInput value={locationText} onChange={handleDestination} placeholder="Skriv fx Milano…" />
              <button
                type="button"
                onClick={useGps}
                disabled={gpsLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
              >
                <LocateFixed className={cn("h-4 w-4", gpsLoading && "animate-pulse")} />
                {gpsLoading ? "Finder din lokation…" : "Brug min lokation"}
              </button>
            </section>

            {category === "restaurant" && (
              <section className="space-y-2">
                <p className="text-sm font-semibold">Hvad har du lyst til?</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
                  <select
                    value={foodType}
                    onChange={(event) => {
                      setFoodType(event.target.value as FoodType);
                      setResults([]);
                      setSurpriseMessage(null);
                    }}
                    className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    aria-label="Vælg type restaurant"
                  >
                    {FOOD_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={surpriseMe}
                    className="min-h-12 rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:bg-accent/20"
                  >
                    🎲 Overrask mig
                  </button>
                </div>
                {surpriseMessage && <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">{surpriseMessage}</p>}
              </section>
            )}

            <section className="space-y-2">
              <p className="text-sm font-semibold">Afstand</p>
              <div className="grid grid-cols-3 gap-2">
                {RADII.map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => { setRadiusKm(km); setResults([]); }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                      radiusKm === km ? "border-primary bg-primary text-primary-foreground shadow-neon-primary" : "border-border bg-background/60 hover:border-primary/50"
                    )}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </section>

            <NeonButton size="lg" className="w-full" onClick={search} disabled={loading || !location}>
              <Search className="mr-2 h-5 w-5" />
              {loading ? "Søger…" : `Find ${category === "hotel" ? "hoteller" : "restauranter"}`}
            </NeonButton>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Google-score vises, når Google-kilden er tilgængelig. OpenStreetMap tager automatisk over ved driftsstop.
            </p>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-[2rem] bg-gradient-to-br from-primary/15 via-secondary/25 to-accent/10 p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Neon Voyages 2.0</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
                {category === "hotel" ? "Find et hotel, du kan stole på" : "Find det rigtige sted at spise"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Søg efter de nærmeste steder, sammenlign afstand og score, og åbn anmeldelserne før du vælger.
              </p>
            </div>

            {notice && <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">{notice}</div>}
            {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

            {loading && (
              <PacmanLoader />
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="flex items-center justify-between px-1">
                  <p className="font-semibold">
                    {results.length === 100 ? "Viser de 100 nærmeste steder" : `${results.length} steder fundet`}
                    {category === "restaurant" && foodType !== "all" ? ` · ${selectedFoodLabel}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Sorteret efter afstand</p>
                </div>
                <div className="grid gap-4">
                  {results.slice(0, visibleCount).map((place, index) => (
                    <StayResultCard key={place.id} place={place} rank={index + 1} />
                  ))}
                </div>
                {visibleCount < results.length && (
                  <NeonButton variant="secondary" className="w-full" onClick={() => setVisibleCount((count) => count + 10)}>
                    Vis 10 mere
                  </NeonButton>
                )}
              </>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="rounded-[2rem] border border-dashed border-border p-10 text-center text-muted-foreground">
                Vælg sted, afstand og kategori for at starte søgningen.
              </div>
            )}

            <p className="pt-2 text-center text-xs text-muted-foreground">Google-rating er en brugervurdering og ikke hotellets officielle stjerneklassifikation.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
