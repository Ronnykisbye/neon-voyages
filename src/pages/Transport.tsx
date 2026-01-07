// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Car, Bus, Info, Map } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { EmptyState } from "@/components/EmptyState";
import { TripGuard } from "@/components/TripGuard";
import { useTrip } from "@/context/TripContext";

// Fælles SearchControls (kun scope her)
import SearchControls, {
  readScope,
  writeScope,
  type Scope,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Hjælpere
// ============================================================================
function getTripCountryCode(trip: any): string | undefined {
  const cc =
    trip?.location?.countryCode ||
    trip?.countryCode ||
    trip?.location?.country_code;
  return typeof cc === "string" ? cc.toLowerCase() : undefined;
}

function getCityName(trip: any): string | undefined {
  return trip?.location?.name || trip?.destination || undefined;
}

// ---------------------------------------------------------------------------
// AFSNIT 01A – Kendte transport-links (sikre, statiske)
//  NOTE: Ingen API-nøgler. Kun officielle/velkendte sider.
// ---------------------------------------------------------------------------
function buildTransportLinks(city?: string, countryCodeLower?: string) {
  if (!city) return [];

  const qCity = encodeURIComponent(city);
  const links: {
    group: "Taxi & Ride" | "Offentlig transport";
    title: string;
    description: string;
    url: string;
  }[] = [];

  // ---------- Taxi & Ride ----------
  // Uber (global – ikke alle byer, men link er sikkert)
  links.push({
    group: "Taxi & Ride",
    title: "Uber",
    description: `Bestil Uber i ${city} (hvis tilgængelig)`,
    url: `https://m.uber.com/looking?pickup=my_location&dropoff[formatted_address]=${qCity}`,
  });

  // Bolt (primært EU)
  links.push({
    group: "Taxi & Ride",
    title: "Bolt",
    description: `Bestil Bolt i ${city} (hvis tilgængelig)`,
    url: `https://bolt.eu/`,
  });

  // Almindelig taxa (Google Maps søgning – altid tilgængelig)
  links.push({
    group: "Taxi & Ride",
    title: "Taxi (Google Maps)",
    description: `Taxa i ${city}`,
    url: `https://www.google.com/maps/search/taxi+${qCity}`,
  });

  // ---------- Offentlig transport ----------
  // Google Maps – kollektiv transport
  links.push({
    group: "Offentlig transport",
    title: "Offentlig transport (Google Maps)",
    description: `Ruter og tider i ${city}`,
    url: `https://www.google.com/maps/search/public+transport+${qCity}`,
  });

  // Nationale officielle sider (kun når vi kender landet)
  if (countryCodeLower === "dk") {
    links.push({
      group: "Offentlig transport",
      title: "Rejseplanen",
      description: "Officiel dansk rejseplan",
      url: "https://www.rejseplanen.dk/",
    });
  }

  if (countryCodeLower === "fr") {
    links.push({
      group: "Offentlig transport",
      title: "Île-de-France Mobilités",
      description: "Officiel kollektiv transport (Paris-området)",
      url: "https://www.iledefrance-mobilites.fr/",
    });
  }

  if (countryCodeLower === "it") {
    links.push({
      group: "Offentlig transport",
      title: "Moovit (Italien)",
      description: "Kollektiv transport i italienske byer",
      url: "https://moovitapp.com/",
    });
  }

  return links;
}

// ============================================================================
// AFSNIT 02 – Content
// ============================================================================
function TransportContent() {
  const { trip } = useTrip();

  const city = getCityName(trip);
  const countryCodeLower = getTripCountryCode(trip);

  const [scope, setScope] = useState<Scope>(() => readScope("nearby"));

  // --------------------------------------------------------------------------
  // Auto-fallback: DK → nearby i udlandet
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (scope === "dk" && countryCodeLower && countryCodeLower !== "dk") {
      setScope("nearby");
      writeScope("nearby");
    }
  }, [scope, countryCodeLower]);

  // --------------------------------------------------------------------------
  // Links (memoized)
  // --------------------------------------------------------------------------
  const links = useMemo(() => {
    return buildTransportLinks(city, countryCodeLower);
  }, [city, countryCodeLower]);

  // ==========================================================================
  // UI
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Transport" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03A – Info + scope
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Vi viser sikre links til transport i området (ingen API-nøgler).
              </p>

              <div className="mt-3">
                <SearchControls
                  showRadius={false}
                  showScope={true}
                  radiusKm={6}
                  scope={scope}
                  onScopeChange={(next) => {
                    setScope(next);
                    writeScope(next);
                  }}
                />
              </div>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Indhold
        ------------------------------------------------------------ */}
        {!city && (
          <EmptyState
            title="Ingen destination valgt"
            message="Vælg en destination for at se transportmuligheder."
          />
        )}

        {city && links.length === 0 && (
          <EmptyState
            title="Ingen transportlinks fundet"
            message="Prøv igen eller vælg en anden destination."
          />
        )}

        {city && links.length > 0 && (
          <div className="space-y-4">
            {/* Taxi & Ride */}
            <NeonCard padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-primary" />
                <div className="font-semibold">Taxi & Ride</div>
              </div>
              <div className="space-y-2">
                {links
                  .filter((l) => l.group === "Taxi & Ride")
                  .map((l) => (
                    <a
                      key={l.title}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-accent/10"
                    >
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {l.description}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
              </div>
            </NeonCard>

            {/* Offentlig transport */}
            <NeonCard padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Bus className="h-4 w-4 text-primary" />
                <div className="font-semibold">Offentlig transport</div>
              </div>
              <div className="space-y-2">
                {links
                  .filter((l) => l.group === "Offentlig transport")
                  .map((l) => (
                    <a
                      key={l.title}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-accent/10"
                    >
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {l.description}
                        </div>
                      </div>
                      <Map className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
              </div>
            </NeonCard>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// AFSNIT 04 – Export
// ============================================================================
export default function Transport() {
  return (
    <TripGuard>
      <TransportContent />
    </TripGuard>
  );
}
