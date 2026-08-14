import {
  BedDouble,
  Bus,
  ExternalLink,
  Map,
  MapPin,
  Plane,
  Search,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";

const groups = [
  {
    title: "Hoteller & restauranter",
    description: "Vælg restaurant og madtype i Neon Voyages, eller gå videre til en bookingtjeneste for hotel.",
    icon: BedDouble,
    links: [
      { label: "Restaurant – vælg madtype", href: "/stays", internal: true, kind: "restaurant" },
      { label: "Trivago", href: "https://www.trivago.dk/" },
      { label: "Hotels.com", href: "https://www.hotels.com/" },
      { label: "Booking.com", href: "https://www.booking.com/" },
      { label: "Airbnb", href: "https://www.airbnb.dk/" },
    ],
  },
  {
    title: "Billige flybilletter",
    description: "Sammenlign flypriser på flere tjenester.",
    icon: Plane,
    links: [
      { label: "Skyscanner", href: "https://www.skyscanner.dk/" },
      { label: "Momondo", href: "https://www.momondo.dk/" },
      { label: "Google Flights", href: "https://www.google.com/travel/flights?gl=DK&hl=da" },
    ],
  },
  {
    title: "Kort & rute",
    description: "Åbn kort, navigation og rejseplanlægning direkte herfra.",
    icon: Map,
    links: [
      { label: "Google Maps", href: "https://www.google.com/maps" },
      { label: "OpenStreetMap", href: "https://www.openstreetmap.org/" },
      { label: "Rome2Rio", href: "https://www.rome2rio.com/" },
    ],
  },
  {
    title: "Bil & overnatning på farten",
    description: "Praktiske tjenester, når rejsen foregår i bil.",
    icon: Bus,
    links: [
      { label: "park4night", href: "https://park4night.com/" },
    ],
  },
] as const;

export default function TravelTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Rejseværktøjer"
          subtitle="Dine vigtigste rejsetjenester samlet ét sted"
        />

        <main className="space-y-6">
          <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-secondary/20 to-accent/10 p-5 shadow-card sm:p-7">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Ét sted at starte rejsen fra</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Brug Neon Voyages som dit rejse-dashboard. Restaurant og hotel er samlet ét sted, og de øvrige rejsetjenester ligger lige nedenunder.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <section
                  key={group.title}
                  className="rounded-[2rem] border border-border bg-card/80 p-5 shadow-card backdrop-blur-xl"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold">{group.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {group.links.map((link) => {
                      if ("internal" in link && link.internal) {
                        return (
                          <button
                            key={link.label}
                            type="button"
                            onClick={() => navigate(link.href)}
                            className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-accent/10 px-4 py-3 text-left text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
                          >
                            <span className="flex items-center gap-3">
                              <span className="rounded-xl bg-background/70 p-2 text-primary">
                                <Utensils className="h-5 w-5" />
                              </span>
                              <span>
                                <span className="block">{link.label}</span>
                                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                  Åbner madtype-menuen og “Overrask mig”
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      }

                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Eksterne tjenester åbnes i en ny fane eller i deres app, hvis din enhed understøtter det. Neon Voyages sender ikke personlige oplysninger til tjenesterne via disse genveje.
          </p>
        </main>
      </div>
    </div>
  );
}
