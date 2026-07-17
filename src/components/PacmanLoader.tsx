import type { StayCategory } from "@/services/overpass";

interface PacmanLoaderProps {
  category?: StayCategory;
  title?: string;
  detail?: string;
}

export function PacmanLoader({ category, title, detail }: PacmanLoaderProps) {
  const isHotel = category === "hotel";
  const defaultTitle = isHotel
    ? "Pac-Man leder efter de bedste hoteller…"
    : category === "restaurant"
      ? "Pac-Man leder efter de bedste spisesteder…"
      : "Pac-Man leder efter de bedste steder…";
  const defaultDetail = isHotel
    ? "Han gennemgår hotelklasser og afstande i området."
    : "Det kan tage et øjeblik at gennemgå området.";

  return (
    <div
      className="pacman-loader"
      role="status"
      aria-live="polite"
      aria-label={title || (isHotel ? "Søger efter hoteller" : "Søger efter steder")}
    >
      <div className="pacman-loader__game" aria-hidden="true">
        <div className="pacman-loader__pacman" />
        <div className="pacman-loader__dots">
          {[0, 1, 2, 3, 4, 5].map((dot) => (
            <span key={dot} style={{ animationDelay: `${dot * 0.18}s` }} />
          ))}
        </div>
      </div>
      <p className="font-semibold text-foreground">{title || defaultTitle}</p>
      <p className="text-sm text-muted-foreground">{detail || defaultDetail}</p>
    </div>
  );
}
