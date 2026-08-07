import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Baby,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Toilet,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { PacmanLoader } from "@/components/PacmanLoader";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useTrip } from "@/context/TripContext";
import {
  getElementLatLon,
  queryOverpass,
  type OverpassElement,
} from "@/services/overpass";

type Position = { lat: number; lon: number };

type ToiletResult = {
  element: OverpassElement;
  position: Position;
  distanceMeters: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const SEARCH_RADIUS_METERS = 5000;

function distanceMeters(a: Position, b: Position): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

function buildAddress(tags: Record<string, string> = {}): string | null {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const city = tags["addr:city"] || tags["addr:place"];
  const parts = [street && [street, number].filter(Boolean).join(" "), city].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function tagIsYes(value?: string): boolean {
  return value === "yes" || value === "designated";
}

export default function ToiletNearby() {
  const { trip } = useTrip();
  const location = useLocation();
  const autoLocateStarted = useRef(false);

  const tripPosition = trip.location
    ? { lat: trip.location.lat, lon: trip.location.lon }
    : null;

  const [position, setPosition] = useState<Position | null>(tripPosition);
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const [items, setItems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [babyOnly, setBabyOnly] = useState(false);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        tripPosition
          ? "Din browser understøtter ikke positionsdeling. Vi bruger rejsemålet i stedet."
          : "Din browser understøtter ikke positionsdeling."
      );
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lon: coords.longitude });
        setUsingDeviceLocation(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setUsingDeviceLocation(false);
        setError(
          tripPosition
            ? "Positionen kunne ikke hentes. Tillad placering i browseren, eller brug rejsemålet."
            : "Positionen kunne ikke hentes. Tillad placering i browseren og prøv igen."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }, [tripPosition]);

  useEffect(() => {
    const shouldAutoLocate = new URLSearchParams(location.search).get("locate") === "1";
    if (shouldAutoLocate && !autoLocateStarted.current) {
      autoLocateStarted.current = true;
      locateMe();
    }
  }, [locateMe, location.search]);

  const fetchToilets = useCallback(async (force = false) => {
    if (!position) return;

    const cacheKey = `toilets_${position.lat.toFixed(3)}_${position.lon.toFixed(3)}`;
    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as { timestamp: number; data: OverpassElement[] };
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setItems(cached.data);
            return;
          }
        }
      } catch {
        // Cachefejl må aldrig blokere søgningen.
      }
    }

    setLoading(true);
    setError(null);
    const query = `
[out:json][timeout:25];
(
  nwr(around:${SEARCH_RADIUS_METERS},${position.lat},${position.lon})["amenity"="toilets"];
);
out center tags;
`;

    const result = await queryOverpass(query);
    setLoading(false);

    if (!result.data) {
      setItems([]);
      setError(result.error || "Toiletterne kunne ikke hentes lige nu.");
      return;
    }

    setItems(result.data);
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: result.data })
      );
    } catch {
      // Appen virker stadig uden cache.
    }
  }, [position]);

  useEffect(() => {
    void fetchToilets();
  }, [fetchToilets]);

  const results = useMemo<ToiletResult[]>(() => {
    if (!position) return [];

    return items
      .map((element) => {
        const toiletPosition = getElementLatLon(element);
        if (!toiletPosition) return null;
        return {
          element,
          position: toiletPosition,
          distanceMeters: distanceMeters(position, toiletPosition),
        };
      })
      .filter((item): item is ToiletResult => Boolean(item))
      .filter(({ element }) => {
        const tags = element.tags || {};
        if (freeOnly && tags.fee !== "no") return false;
        if (wheelchairOnly && !tagIsYes(tags.wheelchair)) return false;
        if (babyOnly && !tagIsYes(tags.baby_changing)) return false;
        return true;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [babyOnly, freeOnly, items, position, wheelchairOnly]);

  const searchLabel = usingDeviceLocation
    ? "din aktuelle position"
    : trip.destination
      ? trip.destination
      : "ingen position endnu";

  return (
    <div className="min-h-screen px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Toilet nær mig" showBack backTo={trip.destination ? "/menu" : "/"} />

      <main className="space-y-4 pb-8">
        <NeonCard variant="glow">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Toilet className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Find nærmeste offentlige toilet</h2>
                <p className="text-sm text-muted-foreground">
                  Resultaterne kommer fra OpenStreetMap. Manglende oplysninger vises som ukendte – appen gætter aldrig.
                </p>
              </div>
            </div>

            <NeonButton className="w-full min-h-12" onClick={locateMe} disabled={locating}>
              <LocateFixed className="h-5 w-5 mr-2" />
              {locating ? "Finder din position…" : "Find toiletter ved min position"}
            </NeonButton>

            <p className="text-xs text-center text-muted-foreground">
              Søger omkring {searchLabel}.
            </p>
          </div>
        </NeonCard>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFreeOnly((value) => !value)}
            className={`rounded-xl border px-2 py-3 text-xs font-medium ${freeOnly ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}
          >
            <CircleDollarSign className="h-5 w-5 mx-auto mb-1" />
            Gratis
          </button>
          <button
            type="button"
            onClick={() => setWheelchairOnly((value) => !value)}
            className={`rounded-xl border px-2 py-3 text-xs font-medium ${wheelchairOnly ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}
          >
            <Accessibility className="h-5 w-5 mx-auto mb-1" />
            Handicap
          </button>
          <button
            type="button"
            onClick={() => setBabyOnly((value) => !value)}
            className={`rounded-xl border px-2 py-3 text-xs font-medium ${babyOnly ? "border-primary bg-primary/15 text-primary" : "bg-card"}`}
          >
            <Baby className="h-5 w-5 mx-auto mb-1" />
            Puslebord
          </button>
        </div>

        {loading && (
          <PacmanLoader
            title="Finder toiletter i nærheden…"
            detail="Vi gennemgår offentlige toiletter inden for cirka 5 km."
          />
        )}

        {!position && !loading && !error && (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Tryk på “Find toiletter ved min position”. Du kan bruge toilet-funktionen uden først at oprette en rejse.
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3">
            <p className="text-sm">{error}</p>
            {position && (
              <NeonButton variant="secondary" size="sm" onClick={() => void fetchToilets(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Prøv søgning igen
              </NeonButton>
            )}
          </div>
        )}

        {position && !loading && !error && results.length === 0 && (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Ingen toiletter matcher filtrene inden for 5 km. Slå et filter fra, eller prøv din aktuelle position.
          </div>
        )}

        <div className="space-y-3">
          {results.slice(0, 30).map(({ element, position: toiletPosition, distanceMeters: distance }) => {
            const tags = element.tags || {};
            const name = tags.name || tags.operator || "Offentligt toilet";
            const address = buildAddress(tags);
            const googlePlace = `https://www.google.com/maps/search/?api=1&query=${toiletPosition.lat},${toiletPosition.lon}`;
            const googleRoute = `https://www.google.com/maps/dir/?api=1&destination=${toiletPosition.lat},${toiletPosition.lon}`;
            const osm = `https://www.openstreetmap.org/?mlat=${toiletPosition.lat}&mlon=${toiletPosition.lon}#map=18/${toiletPosition.lat}/${toiletPosition.lon}`;

            return (
              <NeonCard key={`${element.type}-${element.id}`}>
                <div className="space-y-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{name}</h3>
                      <p className="text-sm text-primary font-medium">
                        {formatDistance(distance)} · ca. {walkingMinutes(distance)} min. gang
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                  </div>

                  {address && <p className="text-sm text-muted-foreground">{address}</p>}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      Pris: {tags.fee === "no" ? "gratis" : tags.fee === "yes" ? "betaling" : "ukendt"}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      Handicap: {tagIsYes(tags.wheelchair) ? "ja" : tags.wheelchair === "no" ? "nej" : "ukendt"}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      Puslebord: {tagIsYes(tags.baby_changing) ? "ja" : tags.baby_changing === "no" ? "nej" : "ukendt"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{tags.opening_hours || "Åbningstider ukendt"}</span>
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
                </div>
              </NeonCard>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Kilde: OpenStreetMap-bidragsydere. Kontrollér skiltning og adgang på stedet.
        </p>
      </main>
    </div>
  );
}
