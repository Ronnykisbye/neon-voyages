import {
  buildStaySearchQuery,
  getElementLatLon,
  queryOverpass,
  type OverpassElement,
  type StayCategory,
} from "@/services/overpass";
import type { FoodType } from "@/data/foodTypes";
import type { HotelStars } from "@/data/hotelStars";

export type PlaceSource = "google" | "openstreetmap";

export interface ReviewItem {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export interface PlaceResult {
  id: string;
  name: string;
  category: StayCategory;
  lat: number;
  lon: number;
  distanceMeters: number;
  address?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  googleMapsUrl: string;
  website?: string;
  phone?: string;
  openingHours?: string[];
  cuisine?: string;
  foodDescription?: string;
  officialStars?: number;
  reviews?: ReviewItem[];
  source: PlaceSource;
}

interface SearchResponse {
  places: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    googleMapsUri?: string;
    types?: string[];
    primaryTypeDisplayName?: { text?: string };
  }>;
}

interface DetailsResponse {
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string };
  }>;
}

const proxyUrl = (import.meta.env.VITE_GOOGLE_PLACES_PROXY_URL || "").replace(/\/$/, "");

export function hasGooglePlacesProxy(): boolean {
  return Boolean(proxyUrl);
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceBetweenMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function postProxy<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${proxyUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Google Places svarede med ${response.status}`);
  }
  return payload as T;
}

export async function searchGooglePlaces(
  lat: number,
  lon: number,
  radiusMeters: number,
  category: StayCategory,
  foodType: FoodType = "all"
): Promise<PlaceResult[]> {
  if (!proxyUrl) throw new Error("Google Places er endnu ikke konfigureret");

  const data = await postProxy<SearchResponse>("/api/places/search", {
    lat,
    lon,
    radiusMeters,
    category,
    foodType,
  });

  return (data.places || [])
    .map((place): PlaceResult | null => {
      const placeLat = place.location?.latitude;
      const placeLon = place.location?.longitude;
      if (typeof placeLat !== "number" || typeof placeLon !== "number") return null;

      return {
        id: place.id,
        name: place.displayName?.text || "Unavngivet sted",
        category,
        lat: placeLat,
        lon: placeLon,
        distanceMeters: distanceBetweenMeters(lat, lon, placeLat, placeLon),
        address: place.formattedAddress,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        priceLevel: place.priceLevel,
        googleMapsUrl:
          place.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${placeLat},${placeLon}`,
        source: "google",
        cuisine: place.primaryTypeDisplayName?.text,
        foodDescription:
          category === "restaurant"
            ? place.primaryTypeDisplayName?.text
              ? `${place.primaryTypeDisplayName.text}. Se anmeldelser og menukort for de konkrete retter.`
              : "Google har ikke oplyst en mere præcis køkkentype for stedet."
            : undefined,
      };
    })
    .filter((place): place is PlaceResult => Boolean(place))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function osmName(element: OverpassElement): string {
  const tags = element.tags || {};
  return tags.name || tags["name:da"] || tags["name:en"] || "Unavngivet sted";
}

function osmAddress(tags: Record<string, string>): string | undefined {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const city = tags["addr:city"];
  const first = [street, number].filter(Boolean).join(" ");
  return [first, city].filter(Boolean).join(", ") || undefined;
}

export async function searchOpenStreetMapPlaces(
  lat: number,
  lon: number,
  radiusMeters: number,
  category: StayCategory,
  foodType: FoodType = "all",
  hotelStars: HotelStars = "all"
): Promise<PlaceResult[]> {
  const query = buildStaySearchQuery(lat, lon, radiusMeters, category, foodType, hotelStars);
  const result = await queryOverpass(query);
  if (!result.data) throw new Error(result.error || "OpenStreetMap kunne ikke hentes");

  return result.data
    .map((element): PlaceResult | null => {
      const coords = getElementLatLon(element);
      if (!coords) return null;
      const tags = element.tags || {};
      const name = osmName(element);
      const cuisine = tags.cuisine
        ?.split(";")
        .map((item) => item.trim().replaceAll("_", " "))
        .filter(Boolean)
        .join(", ");
      const foodDescription =
        category === "restaurant"
          ? tags.description ||
            (cuisine
              ? `Køkken: ${cuisine}. Oplysningen kommer fra restaurantens registrerede steddata.`
              : tags.amenity === "cafe"
                ? "Café med drikkevarer og typisk lette serveringer. Det konkrete udvalg er ikke oplyst."
                : tags.amenity === "fast_food"
                  ? "Hurtig servering eller takeaway. Den konkrete køkkentype er ikke oplyst."
                  : "Køkkentypen er ikke oplyst i OpenStreetMap. Se restaurantens hjemmeside eller menukort.")
          : undefined;
      return {
        id: `osm-${element.type}-${element.id}`,
        name,
        category,
        lat: coords.lat,
        lon: coords.lon,
        distanceMeters: distanceBetweenMeters(lat, lon, coords.lat, coords.lon),
        address: osmAddress(tags),
        website: tags.website || tags["contact:website"],
        phone: tags.phone || tags["contact:phone"],
        openingHours: tags.opening_hours ? [tags.opening_hours] : undefined,
        cuisine,
        foodDescription,
        officialStars: /^([1-5])$/.test(tags.stars || "") ? Number(tags.stars) : undefined,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`,
        source: "openstreetmap",
      };
    })
    .filter((place): place is PlaceResult => Boolean(place))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 100);
}

export async function getGooglePlaceDetails(placeId: string): Promise<Partial<PlaceResult>> {
  if (!proxyUrl) return {};
  const place = await postProxy<DetailsResponse>("/api/places/details", { placeId });
  return {
    address: place.formattedAddress,
    rating: place.rating,
    ratingCount: place.userRatingCount,
    priceLevel: place.priceLevel,
    googleMapsUrl: place.googleMapsUri,
    website: place.websiteUri,
    phone: place.nationalPhoneNumber,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    reviews: (place.reviews || []).map((review) => ({
      author: review.authorAttribution?.displayName || "Google-bruger",
      rating: review.rating || 0,
      text: review.text?.text || "",
      relativeTime: review.relativePublishTimeDescription,
    })),
  };
}
