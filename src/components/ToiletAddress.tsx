import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import {
  formatAddress,
  reverseGeocodeAddress,
} from "@/services/geocoding";

type ToiletAddressProps = {
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

type CachedAddress = {
  value: string;
  timestamp: number;
};

const ADDRESS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVERSE_GEOCODE_INTERVAL_MS = 1100;

let reverseGeocodeQueue: Promise<void> = Promise.resolve();
let lastReverseGeocodeAt = 0;

function directAddress(tags?: Record<string, string>): string | null {
  if (!tags) return null;

  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const postcode = tags["addr:postcode"];
  const city = tags["addr:city"] || tags["addr:place"];

  const streetLine = street ? [street, number].filter(Boolean).join(" ") : null;
  const cityLine = [postcode, city].filter(Boolean).join(" ");
  const parts = [streetLine, cityLine].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

function cacheKey(lat: number, lon: number): string {
  return `toilet_address_${lat.toFixed(5)}_${lon.toFixed(5)}`;
}

function readCachedAddress(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedAddress;
    if (
      typeof cached.value === "string" &&
      cached.value.length > 0 &&
      Date.now() - cached.timestamp < ADDRESS_CACHE_TTL_MS
    ) {
      return cached.value;
    }
  } catch {
    // En defekt cache må aldrig blokere visningen.
  }

  return null;
}

function writeCachedAddress(key: string, value: string): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ value, timestamp: Date.now() } satisfies CachedAddress)
    );
  } catch {
    // Appen virker stadig, hvis lokal lagring er slået fra.
  }
}

async function queuedReverseGeocode(lat: number, lon: number) {
  let result: Awaited<ReturnType<typeof reverseGeocodeAddress>> = null;

  reverseGeocodeQueue = reverseGeocodeQueue.then(async () => {
    const wait = Math.max(
      0,
      MIN_REVERSE_GEOCODE_INTERVAL_MS - (Date.now() - lastReverseGeocodeAt)
    );

    if (wait > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }

    result = await reverseGeocodeAddress(lat, lon);
    lastReverseGeocodeAt = Date.now();
  });

  await reverseGeocodeQueue;
  return result;
}

export function ToiletAddress({ lat, lon, tags }: ToiletAddressProps) {
  const osmAddress = useMemo(() => directAddress(tags), [tags]);
  const key = useMemo(() => cacheKey(lat, lon), [lat, lon]);
  const [address, setAddress] = useState<string | null>(() => {
    return osmAddress || readCachedAddress(key);
  });
  const [loading, setLoading] = useState(!address);

  useEffect(() => {
    if (osmAddress) {
      setAddress(osmAddress);
      setLoading(false);
      return;
    }

    const cached = readCachedAddress(key);
    if (cached) {
      setAddress(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void queuedReverseGeocode(lat, lon).then((reverseResult) => {
      if (cancelled) return;

      if (reverseResult) {
        const formatted = formatAddress(tags, reverseResult);
        if (formatted && formatted !== "Adresse ikke tilgængelig") {
          setAddress(formatted);
          writeCachedAddress(key, formatted);
        }
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key, lat, lon, osmAddress, tags]);

  if (!address && !loading) {
    return (
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Adresse ikke registreret</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{address || "Finder adresse…"}</span>
    </div>
  );
}
