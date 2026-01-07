// ======================================================
// AFSNIT 01 – Imports
// ======================================================
import { useEffect, useMemo, useState } from "react";
import { Phone, MapPin, AlertTriangle } from "lucide-react";

import { useTrip } from "@/context/TripContext";
import { queryOverpass } from "@/services/overpass";

import SearchControls from "@/components/SearchControls";
import { PlaceCard } from "@/components/PlaceCard";
import TripGuard from "@/components/TripGuard";


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
// AFSNIT 03 – Hjælpere
// ======================================================
function extractPhone(tags: any): string | null {
  if (!tags) return null;
  const raw =
    tags["contact:phone"] ||
    tags.phone ||
    tags["phone:mobile"] ||
    null;

  if (!raw) return null;

  // Rens nummer (bevar +)
  return raw.replace(/[^0-9+]/g, "");
}

// ======================================================
// AFSNIT 04 – Component
// ======================================================
function HelpContent() {
  const { trip } = useTrip();
  const [type, setType] = useState<HelpType>("hospital");
  const [radiusKm, setRadiusKm] = useState(6);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasLocation = !!trip?.location?.lat;

  // ====================================================
  // AFSNIT 05 – Fetch Overpass
  // ====================================================
  useEffect(() => {
    if (!hasLocation) return;

    const fetchData = async () => {
      setLoading(true);

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
      setLoading(false);
    };

    fetchData();
  }, [type, radiusKm, trip, hasLocation]);

  // ====================================================
  // AFSNIT 06 – UI
  // ====================================================
  if (!hasLocation) {
    return (
      <div className="p-4">
        <p>Vælg en destination for at finde hjælp.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* VIGTIG ADVARSEL */}
      <div className="rounded-xl border border-red-300 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="text-red-600" />
          <p className="text-sm">
            Brug altid officielle kilder i nødsituationer. Appen viser kun
            verificerede steddata – ikke nødnumre.
          </p>
        </div>
      </div>

      {/* SOS INTERNATIONAL – ALTID */}
      <a
        href="https://www.sos.eu/da"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border-2 border-blue-500 p-4 block bg-blue-50"
      >
        <strong>SOS International</strong>
        <p className="text-sm mt-1">
          Dansk rejseservice – kontakt denne ved alvorlige problemer i udlandet.
        </p>
      </a>

      {/* TYPE VALG */}
      <div className="flex gap-2">
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

      {/* SEARCH CONTROLS */}
      <SearchControls
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        showScope={false}
      />

      {/* RESULTATER */}
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

              <div className="flex gap-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Ring
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm"
                >
                  <MapPin className="h-4 w-4" />
                  Rute
                </a>
              </div>
            </div>
          );
        })}
      </div>
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
