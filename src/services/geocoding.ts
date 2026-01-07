// ============================================================================
// AFSNIT 00 – OpenStreetMap Nominatim geocoding service
// Free and open, rate-limit friendly
// ============================================================================

export interface LocationResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;

  // Landnavn (fx "Denmark")
  country?: string;

  // NYT: ISO-2 landekode i lowercase (fx "dk")
  countryCode?: string;

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
    country_code?: string; // <-- NYT
    state?: string;
  };
  type: string;
  class: string;
}

// ============================================================================
// AFSNIT 01 – Simple in-memory cache
// ============================================================================
const cache = new Map<string, { data: LocationResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// AFSNIT 02 – Search (forward geocoding)
// ============================================================================
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
          // NB: Det her er kun en header-identitet, ikke sikkerhed.
          // Vi retter navnet senere hvis du ønsker det – ingen funktionel betydning.
          "User-Agent": "UngRejseApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    const results: LocationResult[] = data.map((item) => {
      const countryCode = item.address?.country_code
        ? String(item.address.country_code).toLowerCase()
        : undefined;

      return {
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
        countryCode, // <-- NYT
        type: item.type,
      };
    });

    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

// ============================================================================
// AFSNIT 03 – Google Maps helpers
// ============================================================================
export function getGoogleMapsUrl(lat: number, lon: number, name?: string): string {
  const queryStr = name ? encodeURIComponent(name) : `${lat},${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${queryStr}`;
}

export function getGoogleMapsDirectionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

// ============================================================================
// AFSNIT 04 – Reverse geocoding (til PlaceCard + GPS)
// ============================================================================
export interface ReverseGeocodingResult {
  displayName: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  suburb?: string;

  // Landnavn (fx "Japan")
  country?: string;

  // NYT: ISO-2 landekode i lowercase (fx "jp")
  countryCode?: string;
}

// Reverse geocode coordinates to get address (for PlaceCard)
export async function reverseGeocodeAddress(
  lat: number,
  lon: number
): Promise<ReverseGeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "da,en",
          "User-Agent": "UngRejseApp/1.0",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const cc =
      data.address?.country_code && typeof data.address.country_code === "string"
        ? data.address.country_code.toLowerCase()
        : undefined;

    return {
      displayName: data.display_name,
      street: data.address?.road,
      houseNumber: data.address?.house_number,
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality,
      suburb: data.address?.suburb || data.address?.neighbourhood,
      country: data.address?.country,
      countryCode: cc, // <-- NYT
    };
  } catch {
    return null;
  }
}

// ============================================================================
// AFSNIT 05 – Format address (OSM tags eller reverse geocode)
// ============================================================================
export function formatAddress(
  tags?: Record<string, string>,
  reverseResult?: ReverseGeocodingResult | null
): string {
  // Try OSM tags first
  if (tags) {
    const parts: string[] = [];

    if (tags["addr:street"]) {
      let street = tags["addr:street"];
      if (tags["addr:housenumber"]) {
        street += " " + tags["addr:housenumber"];
      }
      parts.push(street);
    }

    if (tags["addr:city"]) {
      parts.push(tags["addr:city"]);
    } else if (tags["addr:postcode"]) {
      parts.push(tags["addr:postcode"]);
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  // Fall back to reverse geocoding result
  if (reverseResult) {
    const parts: string[] = [];

    if (reverseResult.street) {
      let street = reverseResult.street;
      if (reverseResult.houseNumber) {
        street += " " + reverseResult.houseNumber;
      }
      parts.push(street);
    } else if (reverseResult.suburb) {
      parts.push(reverseResult.suburb);
    }

    if (reverseResult.city) {
      parts.push(reverseResult.city);
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }

    // Last resort: use display name but truncate
    if (reverseResult.displayName) {
      const shortName = reverseResult.displayName.split(",").slice(0, 2).join(",");
      return shortName;
    }
  }

  return "Adresse ikke tilgængelig";
}
