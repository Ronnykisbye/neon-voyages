import { ExternalLink, Hotel, House, Search } from "lucide-react";

const HOTEL_SERVICES = [
  {
    name: "Booking.com",
    short: "Booking",
    url: "https://www.booking.com/",
    icon: Hotel,
    hint: "Hoteller, lejligheder og andre overnatninger",
  },
  {
    name: "Hotels.com",
    short: "Hotels.com",
    url: "https://www.hotels.com/",
    icon: Hotel,
    hint: "Søg og sammenlign hoteller",
  },
  {
    name: "trivago",
    short: "trivago",
    url: "https://www.trivago.dk/",
    icon: Search,
    hint: "Sammenlign hotelpriser på tværs af tjenester",
  },
  {
    name: "Airbnb",
    short: "Airbnb",
    url: "https://www.airbnb.dk/",
    icon: House,
    hint: "Boliger, lejligheder og særlige overnatningssteder",
  },
] as const;

export function HotelBookingMiniLinks() {
  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold">Søg også hos</p>
      <div className="grid grid-cols-2 gap-2">
        {HOTEL_SERVICES.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-background px-2 text-xs font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            {service.short}
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
          </a>
        ))}
      </div>
    </section>
  );
}

export function HotelBookingLinks() {
  return (
    <section className="rounded-[2rem] border border-primary/15 bg-card/80 p-5 shadow-card sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Hotelbooking</p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">Søg videre hos de store hoteltjenester</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Brug Neon Voyages som hurtigt alternativ – eller åbn en bookingtjeneste direkte og sammenlign pris, ledighed og vilkår.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {HOTEL_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <a
              key={service.name}
              href={service.url}
              target="_blank"
              rel="noreferrer"
              className="group relative flex min-h-24 items-center gap-4 overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-br from-background via-background to-primary/10 p-4 shadow-[0_9px_0_hsl(var(--primary)/0.16),0_16px_28px_hsl(var(--foreground)/0.10)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_11px_0_hsl(var(--primary)/0.20),0_20px_34px_hsl(var(--foreground)/0.14)] active:translate-y-1 active:shadow-[0_4px_0_hsl(var(--primary)/0.16),0_8px_18px_hsl(var(--foreground)/0.10)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold sm:text-lg">{service.name}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">{service.hint}</span>
              </span>
              <ExternalLink className="h-5 w-5 shrink-0 text-primary transition group-hover:scale-110" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
