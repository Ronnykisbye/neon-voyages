import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Car,
  CircleDollarSign,
  Droplets,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  SquareParking,
  TentTree,
  Toilet,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { PacmanLoader } from "@/components/PacmanLoader";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useTrip } from "@/context/TripContext";
import { getElementLatLon, queryOverpass, type OverpassElement } from "@/services/overpass";

type Position = { lat: number; lon: number };
type RadiusKm = 10 | 25 | 50;
type PlaceKind = "rest_area" | "services" | "parking" | "caravan" | "camp";

type OvernightResult = {
  element: OverpassElement;
  position: Position;
  distanceMeters: number;
  kind: PlaceKind;
};

const CACHE_TTL_MS = 30 * 60 * 1000;

function distanceMeters(a: Position, b: Position): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function buildAddress(tags: Record<string, string> = {}): string | null {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const city = tags["addr:city"] || tags["addr:place"] || tags["addr:municipality"];
  const postcode = tags["addr:postcode"];
  const parts = [
    street && [street, number].filter(Boolean).join(" "),
    [postcode, city].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function classify(tags: Record<string, string> = {}): PlaceKind {
  if (tags.tourism === "caravan_site") return "caravan";
  if (tags.tourism === "camp_site") return "camp";
  if (tags.highway === "rest_area") return "rest_area";
  if (tags.highway === "services") return "services";
  return "parking";
}

function kindLabel(kind: PlaceKind): string {
  if (kind === "caravan") return "Autocamper-/stellplads";
  if (kind === "camp") return "Campingplads";
  if (kind === "rest_area") return "Rasteplads";
  if (kind === "services") return "Serviceområde";
  return "Parkering";
}

function overnightStatus(kind: PlaceKind, tags: Record<string, string>): string {
  if (tags.motorhome === "no" || tags.caravans === "no") return "Køretøjstype kan være begrænset – kontrollér skiltning";
  if (kind === "caravan") return "Stedet er registreret til autocamper/overnatning – kontrollér regler for almindelig bil";
  if (kind === "camp") return "Campingplads – kontrollér om overnatning i almindelig bil accepteres";
  return "Overnatning er ikke dokumenteret – kontrollér lokal skiltning og regler";
}

function yesNoUnknown(value?: string): string {
  if (value === "yes" || value === "designated") return "ja";
  if (value === "no") return "nej";
  return "ukendt";
}

function buildQuery(lat: number, lon: number, radiusMeters: number): string {
  return `
[out:json][timeout:30];
(
  nwr(around:${radiusMeters},${lat},${lon})["highway"="rest_area"];
  nwr(around:${radiusMeters},${lat},${lon})["highway"="services"];
  nwr(around:${radiusMeters},${lat},${lon})["tourism"="caravan_site"];
  nwr(around:${radiusMeters},${lat},${lon})["tourism"="camp_site"];
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="parking"]["access"!="private"];
);
out center tags;
`;
}

export default function CarOvernight() {
  const { trip } = useTrip();
  const tripPosition = trip.location ? { lat: trip.location.lat, lon: trip.location.lon } : null;

  const [position, setPosition] = useState<Position | null>(tripPosition);
  const [usingGps, setUsingGps] = useState(false);
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(25);
  const [items, setItems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toiletsOnly, setToiletsOnly] = useState(false);
  const [waterOnly, setWaterOnly] = useState(false);
  const [overnightFocused, setOvernightFocused] = useState(true);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS understøttes ikke i denne browser.");
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lon: coords.longitude });
        setUsingGps(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Positionen kunne ikke hentes. Tillad placering i browseren og prøv igen.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
    );
  }, []);

  const fetchPlaces = useCallback(async (force = false) => {
    if (!position) return;

    const key = `car_overnight_${radiusKm}_${position.lat.toFixed(3)}_${position.lon.toFixed(3)}`;
    if (!force) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const cached = JSON.parse(raw) as { timestamp: number; data: OverpassElement[] };
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setItems(cached.data);
            return;
          }
        }
      } catch {
        // Cachefejl må ikke blokere funktionen.
      }
    }

    setLoading(true);
    setError(null);
    const result = await queryOverpass(buildQuery(position.lat, position.lon, radiusKm * 1000));
    setLoading(false);

    if (!result.data) {
      setItems([]);
      setError(result.error || "Stederne kunne ikke hentes lige nu.");
      return;
    }

    setItems(result.data);
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: result.data }));
    } catch {
      // Appen virker stadig uden cache.
    }
  }, [position, radiusKm]);

  useEffect(() => {
    void fetchPlaces();
  }, [fetchPlaces]);

  const results = useMemo<OvernightResult[]>(() => {
    if (!position) return [];

    return items
      .map((element) => {
        const p = getElementLatLon(element);
        if (!p) return null;
        return {
          element,
          position: p,
          distanceMeters: distanceMeters(position, p),
          kind: classify(element.tags || {}),
        };
      })
      .filter((item): item is OvernightResult => Boolean(item))
      .filter(({ element, kind }) => {
        const tags = element.tags || {};
        if (toiletsOnly && yesNoUnknown(tags.toilets) !== "ja" && tags.amenity !== "toilets") return false;
        if (waterOnly && yesNoUnknown(tags.drinking_water) !== "ja" && yesNoUnknown(tags.water_point) !== "ja") return false;
        if (overnightFocused && !["caravan", "camp", "rest_area", "services"].includes(kind)) return false;
        return true;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [items, overnightFocused, position, toiletsOnly, waterOnly]);

  const searchLabel = usingGps ? "din aktuelle GPS-position" : trip.destination || "ingen position endnu";

  return (
    <div className="min-h-screen px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Overnat i bilen" showBack backTo={trip.destination ? "/menu" : "/"} />

      <main className="space-y-4 pb-8">
        <NeonCard variant="glow">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <BedDouble className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Find et sted at holde for natten</h2>
                <p className="text-sm text-muted-foreground">
                  Finder rastepladser, serviceområder, camping-/stellpladser og offentlig parkering omkring dig.
                </p>
              </div>
            </div>

            <NeonButton className="w-full min-h-12" onClick={locateMe} disabled={locating}>
              <LocateFixed className="h-5 w-5 mr-2" />
              {locating ? "Finder din position…" : "Brug min GPS – jeg er her nu"}
            </NeonButton>

            <p className="text-xs text-center text-muted-foreground">Søger omkring {searchLabel}.</p>
          </div>
        </NeonCard>

        <section className="space-y-2">
          <p className="text-sm font-semibold">Søgeradius</p>
          <div className="grid grid-cols-3 gap-2">
            {([10, 25, 50] as RadiusKm[]).map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium ${radiusKm === km ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}
              >
                {km} km
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setOvernightFocused((v) => !v)} className={`rounded-xl border px-2 py-3 text-xs font-medium ${overnightFocused ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}>
            <BedDouble className="h-5 w-5 mx-auto mb-1" />
            Bedst til nat
          </button>
          <button type="button" onClick={() => setToiletsOnly((v) => !v)} className={`rounded-xl border px-2 py-3 text-xs font-medium ${toiletsOnly ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}>
            <Toilet className="h-5 w-5 mx-auto mb-1" />
            Toilet
          </button>
          <button type="button" onClick={() => setWaterOnly((v) => !v)} className={`rounded-xl border px-2 py-3 text-xs font-medium ${waterOnly ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}>
            <Droplets className="h-5 w-5 mx-auto mb-1" />
            Vand
          </button>
        </div>

        <NeonCard>
          <div className="flex items-start gap-3 text-sm">
            <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              En parkerings- eller rasteplads er ikke automatisk et lovligt overnatningssted. Appen viser kun det, datakilden dokumenterer. Kontrollér altid skiltning og lokale regler på stedet.
            </p>
          </div>
        </NeonCard>

        {loading && (
          <PacmanLoader title="Finder steder i nærheden…" detail={`Søger inden for ${radiusKm} km.`} />
        )}

        {!position && !loading && !error && (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Tryk på “Brug min GPS – jeg er her nu”. Funktionen kan bruges uden først at planlægge en rejse.
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3">
            <p className="text-sm">{error}</p>
            {position && (
              <NeonButton variant="secondary" size="sm" onClick={() => void fetchPlaces(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Søg igen
              </NeonButton>
            )}
          </div>
        )}

        {position && !loading && !error && results.length === 0 && (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Ingen steder matcher filtrene inden for {radiusKm} km. Prøv en større radius eller slå et filter fra.
          </div>
        )}

        <div className="space-y-3">
          {results.slice(0, 40).map(({ element, position: placePosition, distanceMeters: distance, kind }) => {
            const tags = element.tags || {};
            const name = tags.name || tags.operator || kindLabel(kind);
            const address = buildAddress(tags);
            const googlePlace = `https://www.google.com/maps/search/?api=1&query=${placePosition.lat},${placePosition.lon}`;
            const googleRoute = `https://www.google.com/maps/dir/?api=1&destination=${placePosition.lat},${placePosition.lon}`;
            const osm = `https://www.openstreetmap.org/?mlat=${placePosition.lat}&mlon=${placePosition.lon}#map=17/${placePosition.lat}/${placePosition.lon}`;
            const website = tags.website || tags.url;
            const fee = tags.fee === "no" ? "gratis" : tags.fee === "yes" ? "betaling" : "ukendt";
            const toiletInfo = yesNoUnknown(tags.toilets);
            const waterInfo = yesNoUnknown(tags.drinking_water || tags.water_point);
            const powerInfo = yesNoUnknown(tags.power_supply || tags.electricity);

            return (
              <NeonCard key={`${element.type}-${element.id}`}>
                <div className="space-y-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {kind === "parking" ? <SquareParking className="h-4 w-4" /> : kind === "camp" || kind === "caravan" ? <TentTree className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                        <span>{kindLabel(kind)}</span>
                      </div>
                      <h3 className="font-bold">{name}</h3>
                      <p className="text-sm text-primary font-medium">{formatDistance(distance)} i luftlinje</p>
                    </div>
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                  </div>

                  {address && <p className="text-sm text-muted-foreground">📍 {address}</p>}

                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {overnightStatus(kind, tags)}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2.5 py-1"><Toilet className="inline h-3.5 w-3.5 mr-1" />Toilet: {toiletInfo}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1"><Droplets className="inline h-3.5 w-3.5 mr-1" />Vand: {waterInfo}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1"><Zap className="inline h-3.5 w-3.5 mr-1" />Strøm: {powerInfo}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1"><CircleDollarSign className="inline h-3.5 w-3.5 mr-1" />Pris: {fee}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <a href={googlePlace} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border bg-card px-2 text-xs font-medium">
                      <ExternalLink className="h-4 w-4" /> Google
                    </a>
                    <a href={googleRoute} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-xs font-medium text-primary-foreground">
                      <Navigation className="h-4 w-4" /> Rute
                    </a>
                    <a href={osm} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border bg-card px-2 text-xs font-medium">
                      <MapPin className="h-4 w-4" /> OSM
                    </a>
                  </div>

                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline">
                      <ExternalLink className="h-4 w-4" /> Stedets hjemmeside
                    </a>
                  )}
                </div>
              </NeonCard>
            );
          })}
        </div>

        <NeonCard variant="glow">
          <div className="space-y-3">
            <div>
              <h3 className="font-bold">Flere overnatningssteder</h3>
              <p className="text-sm text-muted-foreground">
                park4night har en stor brugerbaseret database med overnatningssteder og anmeldelser. Neon Voyages kopierer ikke deres data, men kan sende dig videre til deres søgning.
              </p>
            </div>
            <a href="https://park4night.com/en/search" target="_blank" rel="noopener noreferrer" className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              <ExternalLink className="h-5 w-5" /> Åbn park4night
            </a>
            <button type="button" onClick={() => position && navigator.clipboard?.writeText(`${position.lat.toFixed(6)}, ${position.lon.toFixed(6)}`)} disabled={!position} className="w-full rounded-xl border px-3 py-3 text-sm font-medium disabled:opacity-50">
              Kopiér min GPS-position
            </button>
          </div>
        </NeonCard>

        <a href="#/toilet-nearby?locate=1" className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card font-semibold text-primary">
          <Toilet className="h-5 w-5" /> Find nærmeste offentlige toilet
        </a>

        <p className="text-center text-xs text-muted-foreground">
          Steddata: OpenStreetMap-bidragsydere. Ekstern søgning: park4night.
        </p>
      </main>
    </div>
  );
}
