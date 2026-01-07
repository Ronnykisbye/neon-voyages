// ======================================================
// AFSNIT 01 – Imports
// ======================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTrip } from "@/context/TripContext";
import { SearchControls } from "@/components/SearchControls";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { GlobalLoadingIndicator } from "@/components/GlobalLoadingIndicator";
import { PlaceCard } from "@/components/PlaceCard";
import { getTripCountryCode } from "@/lib/trip";
import { writeScope, readScope } from "@/lib/searchScope";
import { fetchOverpass } from "@/lib/overpass";

// ======================================================
// AFSNIT 02 – Typer & konstanter
// ======================================================
type HelpKind = "hospital" | "clinic" | "police";

const HELP_KINDS: { key: HelpKind; label: string }[] = [
  { key: "hospital", label: "Hospitaler" },
  { key: "clinic", label: "Klinikker" },
  { key: "police", label: "Politi" },
];

// OSM-tags pr. type
const OSM_TAGS: Record<HelpKind, string[]> = {
  hospital: ["amenity=hospital"],
  clinic: ["amenity=clinic", "amenity=doctors"],
  police: ["amenity=police"],
};

// ======================================================
// AFSNIT 03 – Komponent
// ======================================================
export default function Help() {
  const { trip } = useTrip();

  const [scope, setScope] = useState<string>(() => readScope("nv_help_scope") ?? "nearby");
  const [radiusKm, setRadiusKm] = useState<number>(6);
  const [kind, setKind] = useState<HelpKind>("hospital");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = Boolean(trip?.location?.lat && trip?.location?.lon);

  // ======================================================
  // AFSNIT 04 – Auto-fallback: dk → nearby i udlandet
  // ======================================================
  useEffect(() => {
    const cc = getTripCountryCode(trip);
    if (scope === "dk" && cc && cc !== "dk") {
      setScope("nearby");
      writeScope("nearby", "nv_help_scope");
    }
  }, [trip, scope]);

  // ======================================================
  // AFSNIT 05 – Query-bygger
  // ======================================================
  const query = useMemo(() => {
    if (!trip?.location) return null;

    const { lat, lon } = trip.location;
    const tags = OSM_TAGS[kind];

    return {
      lat,
      lon,
      radiusKm,
      scope,
      tags,
      limit: 15,
    };
  }, [trip, radiusKm, scope, kind]);

  // ======================================================
  // AFSNIT 06 – Fetch
  // ======================================================
  const fetchHelp = useCallback(
    async (opts?: { forceRefresh?: boolean }) => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchOverpass({
          type: "help",
          ...query,
          forceRefresh: opts?.forceRefresh === true,
        });

        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError("Kunne ikke hente hjælp i området.");
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  // Auto-fetch ved ændringer
  useEffect(() => {
    if (hasLocation) fetchHelp();
  }, [hasLocation, fetchHelp]);

  // ======================================================
  // AFSNIT 07 – Render guards
  // ======================================================
  if (!hasLocation) {
    return <ErrorState title="Ingen lokation" message="Vælg en destination for at finde hjælp." />;
  }

  // ======================================================
  // AFSNIT 08 – UI
  // ======================================================
  return (
    <main className="flex flex-col gap-6 pb-6">
      {/* Vigtigt */}
      <div className="rounded-xl border border-pink-300 bg-pink-50 p-4 text-sm">
        <strong>Vigtigt</strong>
        <p className="mt-1">
          Nødnumre varierer fra land til land. Tjek altid officielle kilder for dit rejsemål.
        </p>
      </div>

      {/* Kontroller */}
      <SearchControls
        scope={scope}
        onScopeChange={(v) => {
          setScope(v);
          writeScope(v, "nv_help_scope");
        }}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        hideDistanceHint={false}
      />

      {/* Type-valg */}
      <div className="flex gap-2">
        {HELP_KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`rounded-lg px-3 py-2 text-sm ${
              kind === k.key ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Resultater */}
      {loading && <GlobalLoadingIndicator />}
      {!loading && error && <ErrorState title="Fejl" message={error} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Ingen resultater" message="Prøv at øge afstanden eller skift type." />
      )}

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <PlaceCard key={item.id} place={item} />
        ))}
      </div>

      {/* Dansk hjælp – altid */}
      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Dansk hjælp i udlandet</h2>

        <a
          href="https://www.sos.eu/da"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border p-4 hover:bg-muted"
        >
          <strong>SOS International</strong>
          <p className="text-sm mt-1">
            Dansk rejseservice – bruges ofte via dit forsikringsselskab.
          </p>
        </a>

        <a
          href="https://um.dk/rejse-og-ophold"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border p-4 hover:bg-muted"
        >
          <strong>Rejsevejledninger</strong>
          <p className="text-sm mt-1">Udenrigsministeriet</p>
        </a>

        <a
          href="https://um.dk/rejse-og-ophold/ambassader-og-repraesentationer"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border p-4 hover:bg-muted"
        >
          <strong>Find dansk ambassade</strong>
          <p className="text-sm mt-1">Udenrigsministeriet</p>
        </a>
      </section>
    </main>
  );
}
