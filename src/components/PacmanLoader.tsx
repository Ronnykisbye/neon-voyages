export function PacmanLoader() {
  return (
    <div className="pacman-loader" role="status" aria-live="polite" aria-label="Søger efter steder">
      <div className="pacman-loader__game" aria-hidden="true">
        <div className="pacman-loader__pacman" />
        <div className="pacman-loader__dots">
          {[0, 1, 2, 3, 4, 5].map((dot) => (
            <span key={dot} style={{ animationDelay: `${dot * 0.18}s` }} />
          ))}
        </div>
      </div>
      <p className="font-semibold text-foreground">Pac-Man leder efter de bedste steder…</p>
      <p className="text-sm text-muted-foreground">Det kan tage et øjeblik at gennemgå området.</p>
    </div>
  );
}

