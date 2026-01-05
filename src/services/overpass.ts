// ============================================================================
// AFSNIT 00 – Overpass API service (fallback + caching)
// NOTE: Vi prøver de mest stabile endpoints først for at undgå 504 timeouts.
// ============================================================================

export const OVERPASS_ENDPOINTS = [
  // 1) Ofte stabil
  "https://overpass.kumi.systems/api/interpreter",
  // 2) God fallback
  "https://overpass.nchc.org.tw/api/interpreter",
  // 3) Kendt men kan være travl (sættes sidst for at minimere 504 i console)
  "https://overpass-api.de/api/interpreter",
];

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

interface CacheEntry {
  data: OverpassElement[];
  timestamp: number;
}

export function getCacheKey(lat: number, lon: number, category: string): string {
  return `overpass_${category}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
}

export function getFromCache<T = OverpassElement[]>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry = JSON.parse(cached) as CacheEntry;
    if (!entry || !entry.timestamp) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION_MS;
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data as unknown as T;
  } catch (error) {
    console.warn("Error reading from cache:", error);
    return null;
  }
}

export function setCache(key: string, data: OverpassElement[]): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn("Error writing to cache:", error);
  }
}

async function fetchWithTimeout(
  url: string,
  body: string,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      body,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function queryOverpass(
  query: string
): Promise<{ data: OverpassElement[] | null; error: string | null }> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        `data=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.warn(`Overpass endpoint ${endpoint} returned ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.warn(`Overpass endpoint ${endpoint} returned non-JSON response`);
        continue;
      }

      const json: OverpassResponse = await response.json();
      return { data: json.elements || [], error: null };
    } catch (err) {
      console.warn(`Overpass endpoint ${endpoint} failed:`, err);
      continue;
    }
  }

  return { data: null, error: "Overpass er travl lige nu – prøv igen om lidt" };
}

// ============================================================================
// AFSNIT 01 – Koordinater helper
// ============================================================================

export function getElementLatLon(
  element: OverpassElement
): { lat: number; lon: number } | null {
  if (
    element.type === "node" &&
    typeof element.lat === "number" &&
    typeof element.lon === "number"
  ) {
    return { lat: element.lat, lon: element.lon };
  }
  if (
    element.center &&
    typeof element.center.lat === "number" &&
    typeof element.center.lon === "number"
  ) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

// ✅ Bevar gammelt API-navn som PlaceCard forventer
export function getCoordinates(
  element: OverpassElement
): { lat: number; lon: number } | null {
  return getElementLatLon(element);
}

// ============================================================================
// AFSNIT 02 – Labels & beskrivelser
// ============================================================================

export function getCategoryLabel(tags: Record<string, string>): string {
  if (tags.tourism === "museum") return "Museum";
  if (tags.tourism === "gallery") return "Galleri";
  if (tags.tourism === "zoo") return "Zoo";
  if (tags.tourism === "aquarium") return "Akvarium";
  if (tags.tourism === "theme_park") return "Forlystelsespark";
  if (tags.tourism === "viewpoint") return "Udsigtspunkt";
  if (tags.tourism === "attraction") return "Attraktion";
  if (tags.tourism === "artwork") return "Kunst";
  if (tags.historic === "castle") return "Slot";
  if (tags.historic === "monument") return "Monument";
  if (tags.historic === "memorial") return "Mindesmærke";
  if (tags.historic === "ruins") return "Ruiner";
  if (tags.historic === "church") return "Historisk kirke";
  if (tags.historic) return "Historisk sted";
  if (tags.amenity === "place_of_worship") return "Kirke/Tempel";
  if (tags.amenity === "cafe") return "Café";
  if (tags.amenity === "bakery") return "Bageri";
  if (tags.amenity === "restaurant") return "Restaurant";
  if (tags.amenity === "fast_food") return "Fast food";
  if (tags.amenity === "marketplace") return "Marked";
  if (tags.amenity === "fountain") return "Springvand";
  if (tags.leisure === "park") return "Park";
  if (tags.shop) return "Butik";
  return "Sted";
}

export function getShortDescription(tags: Record<string, string>): string {
  if (tags.description) return tags.description;
  if (tags["short_description"]) return tags["short_description"] as string;

  if (tags.tourism === "museum")
    return "Museer byder typisk på udstillinger, samlinger og kulturhistorie.";
  if (tags.tourism === "gallery")
    return "Gallerier viser kunst – ofte lokale og skiftende udstillinger.";
  if (tags.tourism === "viewpoint") return "Et godt sted til udsigt og billeder.";
  if (tags.tourism === "attraction")
    return "Turistattraktioner er populære besøgs- og oplevelsesmål.";
  if (tags.amenity === "cafe") return "Café med kaffe, te og lette måltider.";
  if (tags.amenity === "bakery") return "Bageri med brød, kager og ofte kaffe.";
  if (tags.amenity === "restaurant")
    return "Restaurant med servering og typisk flere retter.";
  if (tags.amenity === "fast_food")
    return "Hurtig mad – takeaway eller enkel servering.";
  if (tags.amenity === "marketplace")
    return "Marked med boder – ofte lokale varer og mad.";
  if (tags.leisure === "park")
    return "Grønt område til gåture, afslapning og hygge.";
  if (tags.historic) return "Historisk sted med lokal betydning.";
  return "Et sted i området.";
}

// ✅ Bevar gammelt API-navn som PlaceCard forventer
export function getCategoryDescription(tags: Record<string, string>): string {
  return getShortDescription(tags);
}

// ============================================================================
// AFSNIT 03 – Queries
// ============================================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "all";

export function buildFoodQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
  meal: MealType
): string {
  const breakfast = `nwr(around:${radiusMeters},${lat},${lon})["amenity"~"^(cafe|bakery)$"];`;
  const lunch = `nwr(around:${radiusMeters},${lat},${lon})["amenity"~"^(cafe|restaurant)$"];`;
  const dinner = `nwr(around:${radiusMeters},${lat},${lon})["amenity"~"^(restaurant|fast_food)$"];`;
  const all = `nwr(around:${radiusMeters},${lat},${lon})["amenity"~"^(cafe|bakery|restaurant|fast_food)$"];`;

  const block =
    meal === "breakfast"
      ? breakfast
      : meal === "lunch"
      ? lunch
      : meal === "dinner"
      ? dinner
      : all;

  return `
[out:json][timeout:25];
(
  ${block}
);
out center tags;
`;
}

export function buildTouristSpotsQuery(
  lat: number,
  lon: number,
  radiusMeters: number
): string {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${lat},${lon})["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"];
  nwr(around:${radiusMeters},${lat},${lon})["historic"];
  nwr(around:${radiusMeters},${lat},${lon})["leisure"="park"];
);
out center tags;
`;
}

export function buildHiddenGemsQuery(
  lat: number,
  lon: number,
  radiusMeters: number
): string {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${lat},${lon})["tourism"~"^(artwork|viewpoint)$"];
  nwr(around:${radiusMeters},${lat},${lon})["historic"~"^(memorial|ruins|archaeological_site)$"];
  nwr(around:${radiusMeters},${lat},${lon})["natural"~"^(peak|beach|wood)$"];
  nwr(around:${radiusMeters},${lat},${lon})["leisure"~"^(garden|nature_reserve)$"];
);
out center tags;
`;
}

export function buildMarketsQuery(
  lat: number,
  lon: number,
  radiusMeters: number
): string {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="marketplace"];
  nwr(around:${radiusMeters},${lat},${lon})["shop"="supermarket"];
  nwr(around:${radiusMeters},${lat},${lon})["shop"="convenience"];
);
out center tags;
`;
}

export function buildTransportQuery(
  lat: number,
  lon: number,
  radiusMeters: number
): string {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${lat},${lon})["public_transport"~"^(station|stop_position|platform)$"];
  nwr(around:${radiusMeters},${lat},${lon})["railway"~"^(station|halt|tram_stop)$"];
  nwr(around:${radiusMeters},${lat},${lon})["amenity"="bus_station"];
);
out center tags;
`;
}
