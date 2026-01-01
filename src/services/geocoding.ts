// OpenStreetMap Nominatim geocoding service
// Free and open, rate-limit friendly

export interface LocationResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country?: string;
  type: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    state?: string;
  };
  type: string;
  class: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: LocationResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
      "accept-language": "da,en",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "UngRejseApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    const results: LocationResult[] = data.map((item) => ({
      id: String(item.place_id),
      name:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.display_name.split(",")[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      country: item.address?.country,
      type: item.type,
    }));

    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

export function getGoogleMapsUrl(lat: number, lon: number, name?: string): string {
  const query = name ? encodeURIComponent(name) : `${lat},${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleMapsDirectionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}
