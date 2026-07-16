# Neon Voyages 2.0

En responsiv rejseapp til mobil og PC. Version 2 tilføjer søgning efter hoteller og restauranter i en valgt by eller 3, 5 og 10 km fra brugerens GPS-position.

## Datakilder

- Google Places bruges til afstand, Google-rating, antal anmeldelser og anmeldelsesuddrag.
- OpenStreetMap/Overpass er gratis reserve, hvis Google ikke er konfigureret eller midlertidigt ikke svarer.
- Open-Meteo Geocoding bruges til bysøgning.
- Nominatim bruges kun til enkelte omvendte GPS-opslag og ikke til løbende autocomplete.

Google-ratingen er en brugervurdering fra 0,0 til 5,0. Den må ikke forveksles med et hotels officielle stjerneklassifikation.

## Lokal udvikling

Krav: Node.js 20 eller nyere.

```sh
npm ci
npm run dev
```

Kontrol før udgivelse:

```sh
npm run lint
npm run build
npx tsc --noEmit
```

Det eksisterende projekt indeholder nogle ældre lint-fejl. De nye og ændrede version 2-filer kan kontrolleres særskilt med ESLint.

## Google Places uden synlig API-nøgle

API-nøglen må ikke lægges i GitHub Pages eller i en `VITE_`-variabel. Mappen `worker/` indeholder en Cloudflare Worker-proxy, som holder nøglen hemmelig, validerer kald, cacher svar og har daglige grænser.

1. Følg `worker/README.md` og opret Worker, KV-lager og secret.
2. Sæt også en Places API-kvote i Google Cloud. Worker-grænsen alene er ikke en absolut garanti ved samtidige kald.
3. Opret GitHub repository variable `VITE_GOOGLE_PLACES_PROXY_URL` med Worker-adressen.
4. Kør GitHub Pages workflowet igen.

Uden Google-opsætningen virker søgningen fortsat med OpenStreetMap, men uden Google-score og Google-anmeldelser.

## Installation på mobil og PC

Appen er en PWA med manifest og service worker. Brug punktet **Installer app** i menuen. Chrome og Edge kan vise en rigtig installationsknap; iOS viser en kort vejledning til **Føj til hjemmeskærm**.

## Udgivelse

Workflowet `.github/workflows/pages.yml` bygger og udgiver appen til GitHub Pages ved push til `main`.
