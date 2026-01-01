import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { NeonCard } from "./ui/NeonCard";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  title: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  sourceUrl?: string;
  mapsUrl?: string;
  className?: string;
}

export function ResultCard({
  title,
  description,
  address,
  imageUrl,
  sourceUrl,
  mapsUrl,
  className,
}: ResultCardProps) {
  return (
    <NeonCard variant="interactive" padding="none" className={cn("overflow-hidden", className)}>
      {imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Kilde
            </a>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              Google Maps
            </a>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
