// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Calendar, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { EmptyState } from "@/components/EmptyState";
import { TripGuard } from "@/components/TripGuard";
import { useTrip } from "@/context/TripContext";

// Fælles SearchControls (samme scope-logik som resten)
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
  return (
    trip?.location?.name ||
    trip?.destination ||
    undefined
  );
}

// ============================================================================
// AFSNIT 02 – Eksterne, sikre event-links (ingen scraping)
// ============================================================================
function buildEventLinks(city?: string, countryCodeLower?: string) {
  if (!city) return [];

  const q = encodeURIComponent(city);

  return [
    {
      title: "Eventbrite",
      description: `Officielle events i ${city}`,
      url: `https://www.eventbrite.com/d/${countryCodeLower || ""}/${q}/`,
    },
    {
      title: "Facebook Events",
      description: `Lokale begivenheder i ${city}`,
      url: `https://www.facebook.com/events/search/?q=${q}`,
    },
    {
      title: "TimeOut",
      description: `Kultur og events i ${city}`,
      url: `https://www.timeout.com/search?q=${q}`,
    },
    {
      title: "Google Events",
      description: `Events i ${city} (Google)`,
      url: `https://www.google.com/search?q=events+in+${q}`,
    },
  ];
}

// ============================================================================
// AFSNIT 03 – Content
// ============================================================================
function EventsContent() {
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
  // Events-links (memoized)
  // --------------------------------------------------------------------------
  const links = useMemo(() => {
    if (!city) return [];
    return buildEventLinks(city, countryCodeLower);
  }, [city, countryCodeLower]);

  // ==========================================================================
  // UI
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Events" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 04A – Info + scope
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Vi viser sikre eksterne kilder til events i området.
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
           AFSNIT 04B – Links
        ------------------------------------------------------------ */}
        {links.length === 0 && (
          <EmptyState
            title="Ingen events kan vises"
            message="Vælg en destination først."
          />
        )}

        {links.length > 0 && (
          <div className="space-y-3">
            {links.map((link) => (
              <NeonCard key={link.title} padding="sm">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <div className="font-semibold">{link.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {link.description}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </NeonCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// AFSNIT 05 – Export
// ============================================================================
export default function Events() {
  return (
    <TripGuard>
      <EventsContent />
    </TripGuard>
  );
}
