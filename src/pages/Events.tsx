import React from "react";
import { PartyPopper, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

function EventsContent() {
  const { trip } = useTrip();

  const dateRange =
    trip.startDate && trip.endDate
      ? `${format(trip.startDate, "d. MMMM", { locale: da })} - ${format(
          trip.endDate,
          "d. MMMM yyyy",
          { locale: da }
        )}`
      : "";

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Begivenheder" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard variant="glow">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-medium">{dateRange}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Søger efter begivenheder i denne periode
          </p>
        </NeonCard>

        <ApiKeyNotice
          apiName="Event API"
          description="For at vise begivenheder kræves integration med en event-platform. Brug links nedenfor."
          documentationUrl="https://www.eventbrite.com/platform/api"
        />

        <NeonCard>
          <div className="flex flex-col items-center gap-4 py-6">
            <PartyPopper className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Du kan manuelt søge efter begivenheder via disse links:
            </p>
          </div>
        </NeonCard>

        <div className="space-y-3">
          <a
            href={`https://www.eventbrite.com/d/nearby--${encodeURIComponent(trip.destination)}/events/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all"
          >
            <span className="font-medium">Eventbrite</span>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>

          <a
            href={`https://www.facebook.com/events/search?q=${encodeURIComponent(trip.destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all"
          >
            <span className="font-medium">Facebook Events</span>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>

          <a
            href={`https://www.meetup.com/find/?location=${encodeURIComponent(trip.destination)}&source=EVENTS`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all"
          >
            <span className="font-medium">Meetup</span>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>
        </div>
      </main>

      <TripDebug />
    </div>
  );
}

export default function Events() {
  return (
    <TripGuard>
      <EventsContent />
    </TripGuard>
  );
}
