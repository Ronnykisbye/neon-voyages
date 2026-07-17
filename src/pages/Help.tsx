import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Phone, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PacmanLoader } from "@/components/PacmanLoader";
import { PlaceCard } from "@/components/PlaceCard";
import SearchControls, { type RadiusKm } from "@/components/SearchControls";
import { TripGuard } from "@/components/TripGuard";
import { useTrip } from "@/context/TripContext";
import {
  getCoordinates,
  queryOverpass,
  type OverpassElement,
} from "@/services/overpass";

type HelpType = "hospital" | "clinic" | "police";

const HELP_TYPES: { key: HelpType; label: string }[] = [
  { key: "hospital", label: "Hospitaler" },
  { key: "clinic", label: "Læger & klinikker" },
  { key: "police", label: "Politi" },
];

const OSM_FILTERS: Record<HelpType, string[]> = {
  hospital: ['["amenity"="hospital"]'],
  clinic: ['["amenity"="clinic"]', '["amenity"="doctors"]'],
  police: ['["amenity"="police"]'],
};

function extractPhone(tags?: Record<string, string>): string | null {
  const raw = tags?.["contact:phone"] || tags?.phone || tags?.["phone:mobile"];
  return raw ? raw.replace(/[^0-9+]/g, "") : null;
}

function HelpContent() {
  const { trip } = useTrip();
  const [type, setType] = useState<HelpType>("hospital");
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(6);
  const [items, setItems] = useState<OverpassElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const lat = trip.location?.lat;
  const lon = trip.location?.lon;
  const hasLocation = typeof lat === "number" && typeof lon === "number";

  useEffect(() => {
    if (!hasLocation) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const clauses = OSM_FILTERS[type]
        .map((filter) => `nwr(around:${radiusKm * 1000},${lat},${lon})${filter};`)
        .join("\n");

      const query = `
        [out:json][timeout:25];
        (
          ${clauses}
        );
        out center tags;
      `;

      try {
        const result = await queryOverpass(query);
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
          setItems([]);
        } else {
          setItems((result.data || []).filter((item) => item.tags?.name).slice(0, 30));
        }
      } catch {
        if (!cancelled) {
          setError("Hjælpesøgningen kunne ikke gennemføres. Prøv igen.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [hasLocation, lat, lon, radiusKm, type, reloadKey]);

  return (
    <div className="min-h-screen px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Hjælp i nærheden" subtitle={trip.destination} />

        <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p>
              Ring det lokale alarmnummer ved akut fare. Neon Voyages viser steder
              fra OpenStreetMap og erstatter ikke officielle nødtjenester.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h2 className="font-semibold">SOS International</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dansk rejseservice ved alvorlige problemer i udlandet.
          </p>
          <a
            href="https://www.sos.eu/da"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            Åbn SOS International
          </a>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {HELP_TYPES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setType(option.key)}
              className={`min-h-11 rounded-xl px-2 text-sm font-semibold transition ${
                type === option.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-5 rounded-2xl border border-border bg-card/80 p-4">
          <SearchControls
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            showScope={false}
          />
        </div>

        {loading && (
          <PacmanLoader
            title="Pac-Man finder hjælp i nærheden…"
            detail="Han gennemgår hospitaler, læger, klinikker og politi i området."
          />
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Prøv igen
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">Ingen steder fundet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prøv en anden kategori eller en større afstand.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            <p className="px-1 text-sm font-semibold">
              {items.length} steder fundet
            </p>
            {items.slice(0, 15).map((item) => {
              const phone = extractPhone(item.tags);
              const coords = getCoordinates(item);
              const destination = coords
                ? `${coords.lat},${coords.lon}`
                : item.tags?.name || trip.destination;

              return (
                <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-border p-3">
                  <PlaceCard element={item} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        <Phone className="h-4 w-4" />
                        Ring
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      <MapPin className="h-4 w-4" />
                      Vis rute
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Help() {
  return (
    <TripGuard>
      <HelpContent />
    </TripGuard>
  );
}
