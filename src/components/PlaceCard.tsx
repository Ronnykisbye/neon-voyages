import React, { useEffect, useState } from "react";
import { ExternalLink, MapPin, Clock, Phone, Globe, Navigation, Map } from "lucide-react";
import { NeonCard } from "./ui/NeonCard";
import { cn } from "@/lib/utils";
import { reverseGeocodeAddress, formatAddress } from "@/services/geocoding";
import { getCategoryLabel, getCategoryDescription, OverpassElement, getCoordinates } from "@/services/overpass";

interface PlaceCardProps {
  element: OverpassElement;
  className?: string;
}

export function PlaceCard({ element, className }: PlaceCardProps) {
  const [address, setAddress] = useState<string>('Henter adresse...');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const tags = element.tags || {};
  const coords = getCoordinates(element);
  const name = tags.name || tags['name:da'] || tags['name:en'] || 'Unavngivet sted';
  const categoryLabel = getCategoryLabel(tags);
  const categoryDescription = getCategoryDescription(tags);
  const openingHours = tags.opening_hours;
  const website = tags.website || tags['contact:website'];
  const phone = tags.phone || tags['contact:phone'];

  // Map URLs
  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  
  const directionsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}`;
  
  const osmUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=18/${coords.lat}/${coords.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name)}`;

  const osmSourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;

  useEffect(() => {
    async function fetchAddress() {
      // First try OSM address tags
      const osmAddress = formatAddress(tags, null);
      if (osmAddress !== 'Adresse ikke tilgængelig') {
        setAddress(osmAddress);
        setIsLoadingAddress(false);
        return;
      }

      // Fall back to reverse geocoding
      if (coords) {
        const result = await reverseGeocodeAddress(coords.lat, coords.lon);
        setAddress(formatAddress(undefined, result));
      } else {
        setAddress('Adresse ikke tilgængelig');
      }
      setIsLoadingAddress(false);
    }

    fetchAddress();
  }, [element.id, coords?.lat, coords?.lon]);

  return (
    <NeonCard variant="interactive" padding="none" className={cn("overflow-hidden", className)}>
      <div className="p-4 space-y-3">
        {/* Name and category */}
        <div>
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary mb-2">
            {categoryLabel}
          </span>
          <h3 className="font-semibold text-lg text-foreground">{name}</h3>
        </div>

        {/* Category description */}
        <p className="text-sm text-muted-foreground">
          {categoryDescription}
        </p>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className={isLoadingAddress ? 'animate-pulse' : ''}>
            {address}
          </span>
        </div>

        {/* Opening hours */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {openingHours || 'Åbningstider: ukendt – tjek kilden'}
          </span>
        </div>

        {/* Website */}
        {website && (
          <div className="flex items-start gap-2 text-sm">
            <Globe className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-start gap-2 text-sm">
            <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <a
              href={`tel:${phone}`}
              className="text-primary hover:underline"
            >
              {phone}
            </a>
          </div>
        )}

        {/* Map buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
          >
            <Map className="h-4 w-4" />
            Google Maps
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors active:scale-95"
          >
            <Navigation className="h-4 w-4" />
            Rute
          </a>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors active:scale-95"
          >
            <MapPin className="h-4 w-4" />
            OSM Kort
          </a>
        </div>

        {/* Sources */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Kilder:</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={osmSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              OpenStreetMap
            </a>
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Officiel hjemmeside
              </a>
            )}
          </div>
        </div>
      </div>
    </NeonCard>
  );
}
