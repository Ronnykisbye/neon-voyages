// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React from "react";
import {
  ExternalLink,
  Globe,
  Calendar,
  MapPin,
  Info,
  Facebook,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

// ✅ Fælles km-vælger
import SearchControls, {
  readRadiusKm,
  type RadiusKm,
} from "@/components/SearchControls";

// ============================================================================
// AFSNIT 01 – Konstanter
// ============================================================================
const DEFAULT_RADIUS_KM: RadiusKm = 6;

// ============================================================================
// AFSNIT 02 – Content
// ============================================================================
function EventsContent() {
  const { trip } = useTrip();
  const destination = encodeURIComponent(trip.destination);

  // Fælles radius (bruges kun til kontekst/UX her)
  const [radiusKm, setRadiusKm] = React.useState<RadiusKm>(() =>
    readRadiusKm(DEFAULT_RADIUS_KM)
  );

  const externalLinks = [
    {
      label: "Google Events",
      description: "Søg efter events i Google",
      url: `https://www.google.com/search?q=events+in+${destination}`,
      icon: <Search className="h-5 w-5" />,
    },
    {
      label: "Facebook Events",
      description: "Se events på Facebook",
      url: `https://www.facebook.com/events/search?q=${destination}`,
      icon: <Facebook className="h-5 w-5" />,
    },
    {
      label: "Tripadvisor Aktiviteter",
      description: "Ting at lave på Tripadvisor",
      url: `https://www.tripadvisor.com/Search?q=${destination}`,
      icon: <Globe className="h-5 w-5" />,
    },
    {
      label: "Eventbrite",
      description: "Koncerter, workshops og mere",
      url: `https://www.eventbrite.com/d/nearby--${destination}/events/`,
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: "Meetup",
      description: "Lokale arrangementer og grupper",
      url: `https://www.meetup.com/find/?location=${destination}&source=EVENTS`,
      icon: <MapPin className="h-5 w-5" />,
    },
  ];

  // ==========================================================================
  // AFSNIT 03 – UI
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Lokale tips & kalender" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03A – Info + km-vælger
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Søger inden for {radiusKm} km fra centrum.
              </p>

              <div className="mt-3">
                <SearchControls
                  showRadius={true}
                  showScope={false}
                  radiusKm={radiusKm}
                  onRadiusChange={(km) => setRadiusKm(km)}
                />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Events og lokale begivenheder kræver direkte søgning på de
                officielle platforme. Vi henter ingen data automatisk.
              </p>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 03B – Eksterne links
        ------------------------------------------------------------ */}
        <div className="space-y-3">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{link.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>

        {/* ------------------------------------------------------------
           AFSNIT 03C – Kilde-note
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <p className="text-xs text-muted-foreground text-center">
            Alle links åbner i en ny fane på de officielle platforme.
          </p>
        </NeonCard>
      </main>

      <TripDebug />
    </div>
  );
}

// ============================================================================
// AFSNIT 04 – Export
// ============================================================================
export default function Events() {
  return (
    <TripGuard>
      <EventsContent />
    </TripGuard>
  );
}
