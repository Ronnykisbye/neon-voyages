// ======================================================
// AFSNIT 01 – Imports
// ======================================================
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTrip } from "@/context/TripContext";
import { queryOverpass } from "@/services/overpass";

import SearchControls from "@/components/SearchControls";
import { PlaceCard } from "@/components/PlaceCard";
import { TripGuard } from "@/components/TripGuard";

// ======================================================
// AFSNIT 02 – Typer & konstanter
// ======================================================
type HelpType = "hospital" | "clinic" | "police";

const HELP_TYPES: { key: HelpType; label: string }[] = [
  { key: "hospital", label: "Hospitaler" },
  { key: "clinic", label: "Klinikker" },
  { key: "police", label: "Politi" },
];

const OSM_FILTERS: Record<HelpType, string[]> = {
  hospital: ['["amenity"="hospital"]'],
  clinic: ['["amenity"="clinic"]', '["amenity"="doctors"]'],
  police: ['["amenity"="police"]'],
};

// ======================================================
// AFSNIT 03 – Hjælpefunktioner
// ======================================================
function extractPhone(tags: any): string | null {
  if (!tags) return null;
  const raw =
    tags["contact:phone"] ||
    tags.phone ||
    tags["phone:mobile"] ||
    null;

  if (!raw) return null;

  return raw.replace(/[^0-9+]/g, "");
}

// ======================================================
// AFSNIT 04 – Component
// ======================================================
function HelpContent() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const [type, setType] = useState<HelpType>("hospital");
  const [radiusKm, setRadiusKm] = useState(6);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasLocation = Boolean(trip?.location?.lat && trip?.location?.lon);

  // ====================================================
  // AFSNIT 05 – Datahentning (Overpass)
  // ====================================================
  useEffect(() => {
    if (!hasLocation) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const { lat, lon } = trip.location;
        const filters = OSM_FILTERS[type].join("");

        const query = `
          [out:json][timeout:25];
          (
            nwr(around:${radiusKm * 1000},${lat},${lon})${filters};
          );
          out center tags;
        `;

        const res = await queryOverpass(query);
        setItems(res?.data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, radiusKm, hasLocation, trip]);

  // ====================================================
  // AFSNIT 06 – UI
  // ====================================================

  // Mangler lokation
  if (!hasLocation) {
    return (
      <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
        <main className="flex-1 space-y-4 pb-6">

          {/* Returknap */}
          <div className="mb-3">
            <button
              onClick={() => navigate("/menu")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage til menu
            </button>
          </div>

          <p>Vælg en destination for at finde hjælp.</p>
        </main>
      </div>
    );
  }

  // Normal visning
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <main className="flex-1 space-y-6 pb-6">

        {/* Returknap */}
        <div className="mb-3">
          <button
            onClick={() => navigate("/menu")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til menu
          </button>
        </div>

        {/* Advarsel */}
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <span>
              Brug altid officielle kilder i nødsituationer. Appen viser kun
              verificerede steder – ikke nødnumre.
            </span>
          </div>
        </div>

        {/* SOS International */}
        <div className="rounded-xl border bg-blue-50 p-4">
          <h3 className="font-semibold">SOS International</h3>
          <p className="text-sm text-muted-foreground">
            Dansk rejseservice – kontakt denne ved alvorlige problemer i udlandet.
          </p>
          <a
            href="https://www.sos.eu/da"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-sm underline"
          >
            Gå til SOS International
          </a>
        </div>

        {/* Typevalg */}
        <div className="flex gap-2 flex-wrap">
          {HELP_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-3 py-2 rounded-lg text-sm ${
                type === t.key ? "bg-primary text-white" : "bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Afstand */}
        <SearchControls
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          showScope={false}
        />

        {/* Resultater */}
        {loading && <p>Finder hjælp i nærheden…</p>}

        {!loading && items.length === 0 && (
          <p>Ingen steder fundet. Prøv at øge afstanden.</p>
        )}

        <div className="space-y-4">
          {items.slice(0, 15).map((item) => {
            const phone = extractPhone(item.tags);

            return (
              <div key={item.id} className="rounded-xl border p-3 space-y-2">
                <PlaceCard element={item} />

                <div className="flex gap-2 flex-wrap">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Ring
                    </a>
                  )}

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm"
                  >
                    <MapPin className="h-4 w-4" />
                    Rute
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

// ======================================================
// AFSNIT 07 – Export
// ======================================================
export default function Help() {
  return (
    <TripGuard>
      <HelpContent />
    </TripGuard>
  );
}
