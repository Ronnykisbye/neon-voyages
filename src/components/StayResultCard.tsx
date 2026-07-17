import { useState } from "react";
import {
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { getGooglePlaceDetails, type PlaceResult } from "@/services/places";
import { cn } from "@/lib/utils";

interface StayResultCardProps {
  place: PlaceResult;
  rank: number;
}

function scoreLabel(rating?: number): string {
  if (!rating) return "Ingen score endnu";
  if (rating >= 4.7) return "Enestående";
  if (rating >= 4.3) return "Meget god";
  if (rating >= 3.8) return "God";
  if (rating >= 3) return "Middel";
  return "Lav vurdering";
}

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} ud af 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function StayResultCard({ place: initialPlace, rank }: StayResultCardProps) {
  const [place, setPlace] = useState(initialPlace);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleToggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (!next || place.source !== "google" || place.reviews) return;

    setLoading(true);
    setDetailError(null);
    try {
      const details = await getGooglePlaceDetails(place.id);
      setPlace((current) => ({ ...current, ...details }));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Detaljer kunne ikke hentes");
    } finally {
      setLoading(false);
    }
  };

  const distance =
    place.distanceMeters < 1000
      ? `${place.distanceMeters} m`
      : `${(place.distanceMeters / 1000).toFixed(1).replace(".", ",")} km`;

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-card/85 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/40">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-4 text-left sm:p-5"
        aria-expanded={expanded}
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 text-lg font-bold text-primary">
            {rank}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {place.category === "hotel" ? "Hotel" : "Restaurant"} · {distance}
                </p>
                <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                  {place.name}
                </h2>
                {place.category === "hotel" && place.officialStars && (
                  <p className="mt-1 text-sm font-semibold text-amber-500" aria-label={`${place.officialStars} officielle hotelstjerner`}>
                    {"★".repeat(place.officialStars)} <span className="text-xs text-muted-foreground">Officiel hotelklasse</span>
                  </p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </div>

            {place.rating ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-2xl font-bold text-foreground">{place.rating.toFixed(1)}</span>
                <Stars rating={place.rating} />
                <span className="text-sm font-medium text-primary">{scoreLabel(place.rating)}</span>
                <span className="text-xs text-muted-foreground">
                  ({place.ratingCount?.toLocaleString("da-DK") || 0} anmeldelser)
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Tryk her for at se score og anmeldelser på Google</p>
            )}

            {place.category === "restaurant" && place.foodDescription && (
              <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm leading-relaxed text-foreground/80">
                {place.foodDescription}
              </p>
            )}

            {place.address && (
              <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{place.address}</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/70 px-4 pb-5 pt-4 sm:px-5">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Henter anmeldelser…
            </div>
          )}

          {detailError && <p className="mb-4 text-sm text-destructive">{detailError}</p>}

          {!loading && place.reviews && place.reviews.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold">Udvalgte Google-anmeldelser</h3>
              {place.reviews.map((review, index) => (
                <blockquote key={`${review.author}-${index}`} className="rounded-2xl bg-muted/60 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{review.author}</span>
                    <Stars rating={review.rating} />
                    {review.relativeTime && (
                      <span className="text-xs text-muted-foreground">{review.relativeTime}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
                </blockquote>
              ))}
            </section>
          )}

          {!loading && place.source === "google" && place.reviews?.length === 0 && (
            <p className="mb-4 text-sm text-muted-foreground">Google returnerede ingen anmeldelsestekster.</p>
          )}

          {place.openingHours && place.openingHours.length > 0 && (
            <details className="mt-4 rounded-2xl bg-muted/40 p-4">
              <summary className="cursor-pointer font-semibold">Åbningstider</summary>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {place.openingHours.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </details>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <a className="stay-action" href={place.googleMapsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4" /> Se score og anmeldelser på Google
            </a>
            {place.website && (
              <a className="stay-action" href={place.website} target="_blank" rel="noreferrer">
                <Globe className="h-4 w-4" /> Hjemmeside
              </a>
            )}
            {place.category === "hotel" && (
              <a
                className="stay-action"
                href="https://www.trivago.com/"
                target="_blank"
                rel="noreferrer"
                title={`Sammenlign priser på ${place.name} hos Trivago`}
              >
                <CircleDollarSign className="h-4 w-4" /> Find på Trivago
              </a>
            )}
            {place.phone && (
              <a className="stay-action" href={`tel:${place.phone}`}>
                <Phone className="h-4 w-4" /> Ring
              </a>
            )}
          </div>

          <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            {place.source === "google" ? "Score og anmeldelser leveres af Google" : "Steddata leveres af OpenStreetMap"}
          </p>
        </div>
      )}
    </article>
  );
}
