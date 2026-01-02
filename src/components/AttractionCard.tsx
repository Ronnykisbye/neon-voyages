import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  Navigation, 
  Map, 
  Clock, 
  Globe, 
  Phone, 
  ExternalLink,
  Tag
} from "lucide-react";
import { NeonCard } from "./ui/NeonCard";
import { cn } from "@/lib/utils";
import type { AttractionResult } from "@/services/overpass";
import { reverseGeocode } from "@/services/overpass";

interface AttractionCardProps {
  attraction: AttractionResult;
  className?: string;
}

export function AttractionCard({ attraction, className }: AttractionCardProps) {
  const [address, setAddress] = useState<string | null>(attraction.address || null);
  const [loadingAddress, setLoadingAddress] = useState(!attraction.address);

  useEffect(() => {
    if (!attraction.address) {
      setLoadingAddress(true);
      reverseGeocode(attraction.lat, attraction.lon).then((addr) => {
        setAddress(addr);
        setLoadingAddress(false);
      });
    }
  }, [attraction]);

  const googleMapsViewUrl = `https://www.google.com/maps/search/?api=1&query=${attraction.lat},${attraction.lon}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${attraction.lat},${attraction.lon}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${attraction.lat}&mlon=${attraction.lon}#map=18/${attraction.lat}/${attraction.lon}`;

  return (
    <NeonCard variant="interactive" padding="none" className={cn("overflow-hidden", className)}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {attraction.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
              <Tag className="h-3 w-3" />
              {attraction.categoryLabel}
            </span>
          </div>
        </div>

        {/* What to expect */}
        <p className="text-sm text-muted-foreground">
          {attraction.whatToExpect}
        </p>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          {loadingAddress ? (
            <span className="text-muted-foreground/60 animate-pulse">Finder adresse...</span>
          ) : address ? (
            <span className="text-muted-foreground">{address}</span>
          ) : (
            <span className="text-muted-foreground/60 italic">Adresse ikke tilgængelig</span>
          )}
        </div>

        {/* Opening hours */}
        <div className="flex items-start gap-2 text-sm">
          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          {attraction.openingHours ? (
            <span className="text-muted-foreground">{attraction.openingHours}</span>
          ) : (
            <span className="text-muted-foreground/60 italic">
              Åbningstider: ukendt – tjek kilden
            </span>
          )}
        </div>

        {/* Website & Phone */}
        {(attraction.website || attraction.phone) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {attraction.website && (
              <a
                href={attraction.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                Hjemmeside
              </a>
            )}
            {attraction.phone && (
              <a
                href={`tel:${attraction.phone}`}
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {attraction.phone}
              </a>
            )}
          </div>
        )}

        {/* Map buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <a
            href={googleMapsViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors touch-manipulation"
          >
            <MapPin className="h-4 w-4" />
            Google Maps
          </a>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors touch-manipulation"
          >
            <Navigation className="h-4 w-4" />
            Rute
          </a>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors touch-manipulation"
          >
            <Map className="h-4 w-4" />
            OSM Kort
          </a>
        </div>

        {/* Sources */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>Kilder:</span>
          <a
            href={attraction.osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            OpenStreetMap
          </a>
          {attraction.website && (
            <>
              <span>•</span>
              <a
                href={attraction.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Officiel side
              </a>
            </>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
