// ======================================================
// AFSNIT 01 – Imports
// ======================================================
import { useEffect, useState } from "react";
import { Phone, MapPin, AlertTriangle, ArrowLeft } from "lucide-react";
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
// AFSNIT 03 – Hjælpere
// ======================================================
function extractPhone(tags: any): string | null {
  if (!tags) return null;
  const raw = tags["contact:phone"] || tags.phone || tags["phone:mobile"] || null;
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

 // ======================================================
// AFSNIT 06 – UI (layout fix: max width + centered + returknap)
// ======================================================

const navigate = useNavigate();

/* Hvis der mangler lokation */
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

/* Normal visning */
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

      {/* VIGTIG INFO */}
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm">
        Brug altid officielle kilder i nødsituationer. Appen viser kun
        verificerede steder – ikke nødnumre.
      </div>

      {/* SOS INTERNATIONAL */}
      <div className="rounded-xl border bg-blue-50 p-4">
        <h3 className="font-semibold">SOS International</h3>
        <p className="text-sm text-muted-foreground">
          Dansk rejseservice – kontakt denne ved alvorlige problemer i udlandet.
        </p>
      </div>

      {/* Resten af hjælpesiden (tabs, search, resultater) */}
    </main>
  </div>
);


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
