# Neon Voyages 3.2

Neon Voyages er en responsiv rejseapp til iPhone, Android, tablet og computer.
Appen hjælper rejsende med at planlægge en destination, finde steder i nærheden
og gemme de bedste muligheder på deres egen enhed.

**Åbn appen:** https://ronnykisbye.github.io/neon-voyages/

**Installation:** https://ronnykisbye.github.io/neon-voyages/#/install

## Funktioner

- Opret en rejse med destination og datoer.
- Find hoteller og restauranter i en by eller nær brugerens GPS-position.
- Søg inden for 3, 5 eller 10 kilometer.
- Filtrer hoteller efter officiel hotelklasse.
- Filtrer restauranter efter blandt andet lokalt køkken, italiensk, pizza,
  asiatisk, thai, indisk, fisk og skaldyr, vegetarisk og café.
- Brug **Overrask mig** til at vælge en tilfældig madtype.
- Se afstand, adresse, køkkentype og registrerede stedoplysninger.
- Åbn det præcise sted i Google Maps for score, anmeldelser, billeder, rute og
  aktuelle åbningstider.
- Åbn hotellets eller restaurantens hjemmeside og telefonnummer, når oplysningerne
  findes.
- Find hoteller på Trivago. Trivago-knappen er en søgeovergang og lover ikke et
  direkte hotelmatch, da Trivagos interne hotel-id ikke findes i de gratis data.
- Del et sted via telefonens normale delingsmenu.
- Gem op til 100 hoteller og restauranter lokalt på enheden.
- Filtrer gemte steder efter hoteller og restauranter.
- Vælg tidligere gemte hoteller eller restauranter direkte fra dropdownmenuen i
  søgesiden.
- Se vejr, seværdigheder, skjulte perler, madoplevelser, lokale tips, markeder,
  transport og hjælp i nærheden.
- Skift mellem lyst og mørkt tema.

## Mobiloplevelse

Pac-Man vises som fælles animation, mens appen søger. På lange mobilsider vises
en neon-scrollindikator i højre side. Den følger placeringen på siden, viser når
der er mere indhold og skifter til en pil op ved bunden.

Appen er en PWA (Progressive Web App). Den kan installeres fra menuen
**Installer appen**:

- På iPhone åbnes installationssiden i Safari, hvorefter **Del** og
  **Føj til hjemmeskærm** vælges.
- På Android kan Chrome tilbyde **Installer app** eller **Føj til startskærm**.
- På PC kan Chrome og Edge installere appen som et selvstændigt vindue.

## Datakilder

### OpenStreetMap

OpenStreetMap og Overpass bruges til at finde hoteller, restauranter,
seværdigheder, markeder og andre steder. Data kan variere fra område til område,
fordi OpenStreetMap vedligeholdes af bidragydere.

### Google Maps

Neon Voyages kopierer eller scraper ikke Google-data. Knappen
**Se score og anmeldelser på Google** åbner et almindeligt Google Maps-link på
brugerens egen telefon eller computer. Der bruges ingen Google API-nøgle til
denne overgang, og opslaget belaster ikke ejerens Google Cloud-projekt.

Google-score er en brugervurdering og må ikke forveksles med et hotels officielle
stjerneklassifikation.

### Vejr og geokodning

- Open-Meteo bruges til vejr og bysøgning.
- Nominatim kan bruges til enkelte adresse- og lokationsopslag.

## Gemte steder og privatliv

Gemte steder opbevares i browserens lokale lager på den aktuelle enhed:

- Der kræves ingen konto.
- Data sendes ikke til Neon Voyages eller GitHub.
- Anmeldelsestekster gemmes ikke.
- Gemte steder deles ikke automatisk mellem forskellige telefoner.
- Rydning af browserdata eller afinstallation kan fjerne de gemte steder.

GPS bruges kun efter brugerens tilladelse. Den aktuelle position sendes til den
valgte stedtjeneste for at gennemføre søgningen.

## Sikkerhed

Neon Voyages er en statisk GitHub Pages-app uden administratorkonto eller
brugerdatabase. Besøgende kan ikke ændre GitHub-filer gennem appen.

Repository-sikkerheden omfatter:

- GitHub Actions med mindst mulige skriverettigheder.
- Checkout uden gemte GitHub-legitimationsoplysninger.
- CodeQL-scanning ved pull requests, ændringer på `main` og ugentligt.
- Ugentlige Dependabot-opdateringer for npm og GitHub Actions.
- Hemmelige filer og lokale miljøvariabler udelukkes via `.gitignore`.
- Retningslinjer for privat rapportering i [SECURITY.md](SECURITY.md).

Kontoejeren bør desuden bruge tofaktorgodkendelse eller passkey og beskytte
`main`-grenen med pull requests.

## Valgfri Google Places-integration

Mappen `worker/` indeholder kode til en valgfri beskyttet Google Places-proxy.
Den er ikke nødvendig for den nuværende Google Maps-overgang.

Hvis integrationen senere aktiveres:

- Google-nøglen må kun ligge i hostingudbyderens secret-lager.
- Nøglen må aldrig ligge i GitHub eller i en offentlig `VITE_`-variabel.
- Google Cloud skal have en hård kvote og budgetadvarsler.
- Workerens validering, cache og daglige grænser skal bevares.

## Teknologi

- React 18
- TypeScript
- Vite
- Tailwind CSS og shadcn/ui
- React Router
- GitHub Pages
- PWA-manifest og service worker

## Lokal udvikling

Krav: Node.js 22 og npm.

```sh
npm ci
npm run dev
```

Kvalitetskontrol:

```sh
npx tsc --noEmit
npm run build
npm run lint
```

Projektet indeholder ældre lint-advarsler. TypeScript- og produktionsbygningen
skal altid bestå før udgivelse.

## Udgivelse

Workflowet [`.github/workflows/pages.yml`](.github/workflows/pages.yml) bygger
og udgiver automatisk appen til GitHub Pages efter en ændring på `main`.

Normalt arbejdsforløb:

1. Opret en separat branch.
2. Foretag og test ændringerne.
3. Opret en pull request.
4. Gennemgå og flet pull requesten.
5. GitHub Pages bygger og udgiver den nye version.
6. Service workeren opdaterer installerede kopier af appen.

## Begrænsninger

- Dataenes kvalitet afhænger af de eksterne datakilder.
- Google-score og anmeldelser vises hos Google Maps og ikke direkte i appen.
- Trivago kan ikke åbne et garanteret direkte hotellink uden Trivagos interne id.
- Gemte steder er lokale for den enkelte enhed.
- Ingen internetbaseret app kan garanteres fuldstændig fejlfri eller
  angrebssikker, men projektet anvender automatiske sikkerhedskontroller og
  mindst mulige rettigheder.
