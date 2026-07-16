# Neon Voyages Google Places proxy

Denne Cloudflare Worker holder Google API-nøglen væk fra browseren og GitHub.

## Sikker standardgrænse

Workerens standard er højst 25 Google-søgninger og 25 detaljeopslag pr. UTC-døgn. Selv i en måned med 31 dage er det højst 775 opslag i hver kategori. Cachede svar bruger ikke et nyt Google-opslag.

## Opsætning

1. Kopiér `wrangler.toml.example` til `wrangler.toml`.
2. Opret en KV namespace og indsæt dens ID i den lokale `wrangler.toml`.
3. Gem Google-nøglen som en Cloudflare secret med `npx wrangler secret put GOOGLE_MAPS_API_KEY`.
4. Deploy med Wrangler.
5. Sæt Workerens offentlige URL som repository-variable `VITE_GOOGLE_PLACES_PROXY_URL` i GitHub Actions.

`wrangler.toml` og API-nøglen må ikke committes.
