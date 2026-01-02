// Overpass API service with fallback endpoints and caching

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
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
    
    const entry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

export async function fetchWithFallback(endpoints: string[], query: string): Promise<Response> {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.ok) return response;
    } catch {
      continue;
    }
  }
  return new Response(null, { status: 503 });
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
      const response = await fetchWithTimeout(endpoint, `data=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        console.warn(`Overpass endpoint ${endpoint} returned ${response.status}`);
        continue;
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Likely an HTML error page
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

export interface AttractionResult {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  whatToExpect: string;
  lat: number;
  lon: number;
  address?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
  osmUrl: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  museum: "Museum",
  gallery: "Galleri",
  attraction: "Attraktion",
  monument: "Monument",
  memorial: "Mindesmærke",
  castle: "Slot/Borg",
  ruins: "Ruiner",
  archaeological_site: "Arkæologisk udgravning",
  church: "Kirke",
  mosque: "Moské",
  synagogue: "Synagoge",
  temple: "Tempel",
  place_of_worship: "Religiøs bygning",
  park: "Park",
  garden: "Have",
  tower: "Tårn",
  viewpoint: "Udsigtspost",
  artwork: "Kunstværk",
  statue: "Statue",
  fountain: "Springvand",
  column: "Søjle",
  city_gate: "Byport",
};

const CATEGORY_EXPECTATIONS: Record<string, string> = {
  museum: "Museer har ofte udstillinger og historiske artefakter. Tjek åbningstider og entrépris.",
  gallery: "Gallerier udstiller kunst. Besøg kan tage 30 min til flere timer.",
  attraction: "En populær seværdighed. Kan være travlt i højsæsonen.",
  monument: "Et historisk mindesmærke. Ofte gratis at besøge udefra.",
  memorial: "Et mindesmærke for historiske begivenheder eller personer.",
  castle: "Slotte og borge har ofte rundvisninger og museer.",
  ruins: "Historiske ruiner. Bær godt fodtøj.",
  archaeological_site: "Arkæologisk udgravning med historiske fund.",
  church: "Religiøs bygning. Respekter lokale skikke ved besøg.",
  mosque: "Religiøs bygning. Tjek besøgstider for ikke-muslimer.",
  synagogue: "Religiøs bygning. Tjek om besøg er muligt.",
  temple: "Religiøs bygning. Respekter lokale skikke.",
  place_of_worship: "Religiøs bygning. Respekter lokale skikke ved besøg.",
  park: "Grønt område velegnet til gåture og afslapning.",
  garden: "Have med planter og ofte rolige omgivelser.",
  tower: "Tårn med potentiel udsigt over området.",
  viewpoint: "Udsigtspost med panoramaudsigt.",
  artwork: "Offentligt kunstværk.",
  statue: "Skulptur eller statue.",
  fountain: "Springvand, ofte et fotomotiv.",
  column: "Historisk søjle eller monument.",
  city_gate: "Historisk byport.",
};

function categorizeElement(tags: Record<string, string>): { category: string; label: string; expectation: string } {
  // Priority order for categorization
  if (tags.tourism === "museum") return { category: "museum", label: CATEGORY_LABELS.museum, expectation: CATEGORY_EXPECTATIONS.museum };
  if (tags.tourism === "gallery") return { category: "gallery", label: CATEGORY_LABELS.gallery, expectation: CATEGORY_EXPECTATIONS.gallery };
  if (tags.tourism === "attraction") return { category: "attraction", label: CATEGORY_LABELS.attraction, expectation: CATEGORY_EXPECTATIONS.attraction };
  if (tags.tourism === "viewpoint") return { category: "viewpoint", label: CATEGORY_LABELS.viewpoint, expectation: CATEGORY_EXPECTATIONS.viewpoint };
  if (tags.tourism === "artwork") return { category: "artwork", label: CATEGORY_LABELS.artwork, expectation: CATEGORY_EXPECTATIONS.artwork };
  
  if (tags.historic === "monument") return { category: "monument", label: CATEGORY_LABELS.monument, expectation: CATEGORY_EXPECTATIONS.monument };
  if (tags.historic === "memorial") return { category: "memorial", label: CATEGORY_LABELS.memorial, expectation: CATEGORY_EXPECTATIONS.memorial };
  if (tags.historic === "castle") return { category: "castle", label: CATEGORY_LABELS.castle, expectation: CATEGORY_EXPECTATIONS.castle };
  if (tags.historic === "ruins") return { category: "ruins", label: CATEGORY_LABELS.ruins, expectation: CATEGORY_EXPECTATIONS.ruins };
  if (tags.historic === "archaeological_site") return { category: "archaeological_site", label: CATEGORY_LABELS.archaeological_site, expectation: CATEGORY_EXPECTATIONS.archaeological_site };
  if (tags.historic === "city_gate") return { category: "city_gate", label: CATEGORY_LABELS.city_gate, expectation: CATEGORY_EXPECTATIONS.city_gate };
  if (tags.historic === "column") return { category: "column", label: CATEGORY_LABELS.column, expectation: CATEGORY_EXPECTATIONS.column };
  if (tags.historic) return { category: "monument", label: CATEGORY_LABELS.monument, expectation: CATEGORY_EXPECTATIONS.monument };
  
  if (tags.amenity === "place_of_worship") {
    if (tags.religion === "christian") return { category: "church", label: CATEGORY_LABELS.church, expectation: CATEGORY_EXPECTATIONS.church };
    if (tags.religion === "muslim") return { category: "mosque", label: CATEGORY_LABELS.mosque, expectation: CATEGORY_EXPECTATIONS.mosque };
    if (tags.religion === "jewish") return { category: "synagogue", label: CATEGORY_LABELS.synagogue, expectation: CATEGORY_EXPECTATIONS.synagogue };
    return { category: "place_of_worship", label: CATEGORY_LABELS.place_of_worship, expectation: CATEGORY_EXPECTATIONS.place_of_worship };
  }
  
  if (tags.leisure === "park") return { category: "park", label: CATEGORY_LABELS.park, expectation: CATEGORY_EXPECTATIONS.park };
  if (tags.leisure === "garden") return { category: "garden", label: CATEGORY_LABELS.garden, expectation: CATEGORY_EXPECTATIONS.garden };
  
  if (tags.man_made === "tower") return { category: "tower", label: CATEGORY_LABELS.tower, expectation: CATEGORY_EXPECTATIONS.tower };
  
  if (tags.memorial === "statue") return { category: "statue", label: CATEGORY_LABELS.statue, expectation: CATEGORY_EXPECTATIONS.statue };
  if (tags.amenity === "fountain") return { category: "fountain", label: CATEGORY_LABELS.fountain, expectation: CATEGORY_EXPECTATIONS.fountain };
  
  return { category: "attraction", label: CATEGORY_LABELS.attraction, expectation: CATEGORY_EXPECTATIONS.attraction };
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];
  
  if (tags["addr:street"]) {
    let street = tags["addr:street"];
    if (tags["addr:housenumber"]) {
      street += " " + tags["addr:housenumber"];
    }
    parts.push(street);
  }
  
  if (tags["addr:city"] || tags["addr:town"] || tags["addr:village"]) {
    parts.push(tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "");
  }
  
  if (tags["addr:postcode"]) {
    parts.push(tags["addr:postcode"]);
  }
  
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function getWebsite(tags: Record<string, string>): string | undefined {
  return tags.website || tags["contact:website"] || tags.url;
}

function getPhone(tags: Record<string, string>): string | undefined {
  return tags.phone || tags["contact:phone"];
}

export function buildAttractionsQuery(lat: number, lon: number, radiusMeters: number): string {
  return `
[out:json][timeout:25];
(
  node["tourism"="attraction"](around:${radiusMeters},${lat},${lon});
  node["tourism"="museum"](around:${radiusMeters},${lat},${lon});
  node["tourism"="gallery"](around:${radiusMeters},${lat},${lon});
  node["tourism"="viewpoint"](around:${radiusMeters},${lat},${lon});
  node["tourism"="artwork"](around:${radiusMeters},${lat},${lon});
  node["historic"](around:${radiusMeters},${lat},${lon});
  node["amenity"="place_of_worship"]["tourism"](around:${radiusMeters},${lat},${lon});
  node["leisure"="park"]["name"](around:${radiusMeters},${lat},${lon});
  node["man_made"="tower"]["tourism"](around:${radiusMeters},${lat},${lon});
  way["tourism"="attraction"](around:${radiusMeters},${lat},${lon});
  way["tourism"="museum"](around:${radiusMeters},${lat},${lon});
  way["tourism"="gallery"](around:${radiusMeters},${lat},${lon});
  way["historic"]["name"](around:${radiusMeters},${lat},${lon});
  way["leisure"="park"]["name"](around:${radiusMeters},${lat},${lon});
);
out center 60;
`.trim();
}

export function parseAttractions(elements: OverpassElement[]): AttractionResult[] {
  const results: AttractionResult[] = [];
  const seenNames = new Set<string>();
  
  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags["name:en"];
    
    if (!name) continue;
    
    // Deduplicate by name
    const nameLower = name.toLowerCase();
    if (seenNames.has(nameLower)) continue;
    seenNames.add(nameLower);
    
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    
    if (lat === undefined || lon === undefined) continue;
    
    const { category, label, expectation } = categorizeElement(tags);
    
    results.push({
      id: `${el.type}_${el.id}`,
      name,
      category,
      categoryLabel: label,
      whatToExpect: expectation,
      lat,
      lon,
      address: buildAddress(tags),
      openingHours: tags.opening_hours,
      website: getWebsite(tags),
      phone: getPhone(tags),
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    });
  }
  
  return results;
}

export async function fetchAttractions(
  lat: number,
  lon: number
): Promise<{ data: AttractionResult[] | null; error: string | null; radiusUsed: number }> {
  const cacheKey = getCacheKey(lat, lon, "attractions");
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    return { data: parseAttractions(cached), error: null, radiusUsed: 6000 };
  }
  
  // Try with 6km radius first
  let radius = 6000;
  let query = buildAttractionsQuery(lat, lon, radius);
  let result = await queryOverpass(query);
  
  if (result.error) {
    // Maybe timeout, try smaller radius
    radius = 3000;
    query = buildAttractionsQuery(lat, lon, radius);
    result = await queryOverpass(query);
    
    if (result.error) {
      return { data: null, error: result.error, radiusUsed: radius };
    }
  }
  
  let attractions = parseAttractions(result.data || []);
  
  // If too few results, try larger radius
  if (attractions.length < 10 && radius === 6000) {
    radius = 12000;
    query = buildAttractionsQuery(lat, lon, radius);
    const largerResult = await queryOverpass(query);
    
    if (!largerResult.error && largerResult.data) {
      attractions = parseAttractions(largerResult.data);
      // Cache the larger result
      setCache(cacheKey, largerResult.data);
    }
  } else if (result.data) {
    setCache(cacheKey, result.data);
  }

  return { data: attractions, error: null, radiusUsed: radius };
}

// Reverse geocode to get address for places without addr:* tags
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "UngRejseApp/1.0",
          "Accept-Language": "da,en",
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const addr = data.address;
    
    if (!addr) return null;
    
    const parts: string[] = [];
    
    if (addr.road) {
      let street = addr.road;
      if (addr.house_number) street += " " + addr.house_number;
      parts.push(street);
    }
    
    if (addr.suburb || addr.neighbourhood) {
      parts.push(addr.suburb || addr.neighbourhood);
    }
    
    if (addr.city || addr.town || addr.village || addr.municipality) {
      parts.push(addr.city || addr.town || addr.village || addr.municipality);
    }
    
    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  }
}
