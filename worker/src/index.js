const GOOGLE_API = "https://places.googleapis.com/v1";
const VALID_RADII = new Set([3000, 5000, 10000]);
const VALID_CATEGORIES = new Set(["restaurant", "hotel"]);

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    env.ALLOWED_ORIGIN || "https://ronnykisbye.github.io",
    "http://localhost:8080",
    "http://localhost:4173",
  ]);
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(request, env, body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
      ...extra,
    },
  });
}

function addCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders(request, env))) {
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

function dayKey(kind) {
  return `google:${kind}:${new Date().toISOString().slice(0, 10)}`;
}

async function reserveDailyCall(env, kind) {
  if (!env.GOOGLE_USAGE) throw new Error("GOOGLE_USAGE KV mangler");
  const limit = Number(
    kind === "search" ? env.MAX_DAILY_SEARCHES || 25 : env.MAX_DAILY_DETAILS || 25
  );
  const key = dayKey(kind);
  const current = Number((await env.GOOGLE_USAGE.get(key)) || 0);
  if (current >= limit) return false;
  await env.GOOGLE_USAGE.put(key, String(current + 1), { expirationTtl: 172800 });
  return true;
}

async function cacheKey(request, path, payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return new Request(`${new URL(request.url).origin}/__google_cache/${path}/${hash}`);
}

async function googleRequest(env, path, options, fieldMask) {
  return fetch(`${GOOGLE_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });
}

function validateSearch(body) {
  const lat = Number(body.lat);
  const lon = Number(body.lon);
  const radiusMeters = Number(body.radiusMeters);
  const category = body.category;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
  if (!VALID_RADII.has(radiusMeters) || !VALID_CATEGORIES.has(category)) return null;
  return { lat, lon, radiusMeters, category };
}

async function handleSearch(request, env, ctx, body) {
  const input = validateSearch(body);
  if (!input) return json(request, env, { error: "Ugyldige søgeparametre" }, 400);

  const key = await cacheKey(request, "search", input);
  const cached = await caches.default.match(key);
  if (cached) return addCors(cached, request, env);

  if (!(await reserveDailyCall(env, "search"))) {
    return json(request, env, { error: "Dagens sikre Google-grænse er nået" }, 429);
  }

  const response = await googleRequest(
    env,
    "/places:searchNearby",
    {
      method: "POST",
      body: JSON.stringify({
        includedTypes: [input.category === "hotel" ? "lodging" : "restaurant"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: input.lat, longitude: input.lon },
            radius: input.radiusMeters,
          },
        },
      }),
    },
    "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri"
  );

  const text = await response.text();
  if (!response.ok) return json(request, env, { error: "Google Places kunne ikke gennemføre søgningen" }, response.status);
  const outgoing = new Response(text, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" } });
  ctx.waitUntil(caches.default.put(key, outgoing.clone()));
  return addCors(outgoing, request, env);
}

async function handleDetails(request, env, ctx, body) {
  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) {
    return json(request, env, { error: "Ugyldigt Google Place ID" }, 400);
  }

  const key = await cacheKey(request, "details", { placeId });
  const cached = await caches.default.match(key);
  if (cached) return addCors(cached, request, env);

  if (!(await reserveDailyCall(env, "details"))) {
    return json(request, env, { error: "Dagens sikre anmeldelsesgrænse er nået" }, 429);
  }

  const response = await googleRequest(
    env,
    `/places/${encodeURIComponent(placeId)}`,
    { method: "GET" },
    "id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,googleMapsUri,websiteUri,nationalPhoneNumber,regularOpeningHours,reviews"
  );
  const text = await response.text();
  if (!response.ok) return json(request, env, { error: "Google-detaljer kunne ikke hentes" }, response.status);
  const outgoing = new Response(text, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } });
  ctx.waitUntil(caches.default.put(key, outgoing.clone()));
  return addCors(outgoing, request, env);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (request.method !== "POST") return json(request, env, { error: "Kun POST understøttes" }, 405);
    if (!env.GOOGLE_MAPS_API_KEY) return json(request, env, { error: "Google-nøglen er ikke konfigureret" }, 503);

    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = new Set([env.ALLOWED_ORIGIN || "https://ronnykisbye.github.io", "http://localhost:8080", "http://localhost:4173"]);
    if (!allowedOrigins.has(origin)) return json(request, env, { error: "Denne oprindelse er ikke tilladt" }, 403);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json(request, env, { error: "Ugyldig JSON" }, 400);
    const path = new URL(request.url).pathname;

    try {
      if (path === "/api/places/search") return await handleSearch(request, env, ctx, body);
      if (path === "/api/places/details") return await handleDetails(request, env, ctx, body);
      return json(request, env, { error: "Ukendt endpoint" }, 404);
    } catch (error) {
      console.error(error);
      return json(request, env, { error: "Serveren kunne ikke behandle forespørgslen" }, 500);
    }
  },
};
