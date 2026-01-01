import React from "react";
import { AlertTriangle, Key, ExternalLink } from "lucide-react";
import { NeonCard } from "./ui/NeonCard";

interface ApiKeyNoticeProps {
  apiName: string;
  description?: string;
  documentationUrl?: string;
}

export function ApiKeyNotice({
  apiName,
  description,
  documentationUrl,
}: ApiKeyNoticeProps) {
  return (
    <NeonCard variant="accent" className="border-accent/30">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Key className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">
              Kræver API-nøgle: {apiName}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {description ||
              "Denne funktion kræver en API-nøgle for at vise rigtige data. Uden nøgle vises kun testdata eller ingen data."}
          </p>
          {documentationUrl && (
            <a
              href={documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Se dokumentation
            </a>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
