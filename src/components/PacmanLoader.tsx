import type { StayCategory } from "@/services/overpass";

interface PacmanLoaderProps {
  category: StayCategory;
}

export function PacmanLoader({ category }: PacmanLoaderProps) {
  const isHotel = category === "hotel";

  return (
    <div
      className="pacman-loader"
      role="status"
      aria-live="polite"
      aria-label={isHotel ? "Søger efter hoteller" : "Søger efter restauranter"}
    >
      <div className="pacman-loader__game" aria-hidden="true">
        <div className="pacman-loader__pacman" />
        <div className="pacman-loader__dots">
          {[0, 1, 2, 3, 4, 5].map((dot) => (
            <span key={dot} style={{ animationDelay: `${dot * 0.18}s` }} />
          ))}
        </div>
      </div>
      <p className="font-semibold text-foreground">
        {isHotel ? "Pac-Man leder efter de bedste hoteller…" : "Pac-Man leder efter de bedste spisesteder…"}
      </p>
      <p className="text-sm text-muted-foreground">
        {isHotel ? "Han gennemgår hotelklasser og afstande i området." : "Det kan tage et øjeblik at gennemgå området."}
      </p>
    </div>
  );
}
