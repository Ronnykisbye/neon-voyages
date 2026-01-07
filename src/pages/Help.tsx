// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React from "react";
import { AlertTriangle, Phone, ExternalLink, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { TripGuard } from "@/components/TripGuard";
import { useTrip } from "@/context/TripContext";

// ============================================================================
// AFSNIT 01 – Hjælpere (sikre, konservative)
// ============================================================================
function getCountryCodeLower(trip: any): string | undefined {
  const cc =
    trip?.location?.countryCode ||
    trip?.countryCode ||
    trip?.location?.country_code;
  return typeof cc === "string" ? cc.toLowerCase() : undefined;
}

function getCityName(trip: any): string | undefined {
  return trip?.location?.name || trip?.destination || undefined;
}

// EU/EØS (112 gælder)
// NOTE: Konservativ liste. 112 er fælles EU-nødnummer.
const EU_EEA = new Set([
  "dk","se","no","fi","is",
  "de","fr","it","es","pt","nl","be","lu","at","ie",
  "pl","cz","sk","hu","si","hr","ro","bg","ee","lv","lt","mt","cy","gr"
]);

function isEUorEEA(countryCodeLower?: string) {
  return !!countryCodeLower && EU_EEA.has(countryCodeLower);
}

// ============================================================================
// AFSNIT 02 – Content
// ============================================================================
function HelpContent() {
  const { trip } = useTrip();

  const city = getCityName(trip);
  const cc = getCountryCodeLower(trip);
  const inEU = isEUorEEA(cc);

  const googleQuery = encodeURIComponent(
    `${city || ""} emergency number ${cc || ""}`.trim()
  );

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Hjælp" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {/* ------------------------------------------------------------
           AFSNIT 03 – Vigtig advarsel (altid vist)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm" className="border-l-4 border-pink-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-pink-500 mt-0.5" />
            <div>
              <div className="font-semibold">Vigtigt</div>
              <p className="text-sm text-muted-foreground">
                Nødnumre varierer fra land til land. Tjek altid officielle
                kilder for dit rejsemål.
              </p>
            </div>
          </div>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 04 – Generelle nødnumre (EU kun)
        ------------------------------------------------------------ */}
        {inEU && (
          <>
            <div className="text-xs font-semibold tracking-wide text-muted-foreground">
              GENERELLE NØDNUMRE ({cc?.toUpperCase()})
            </div>

            <NeonCard padding="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Nødhjælp (EU)</div>
                    <div className="text-sm text-muted-foreground">
                      Fælles nødnummer i EU (politi, brand, ambulance)
                    </div>
                  </div>
                </div>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground"
                >
                  Ring 112
                </a>
              </div>
            </NeonCard>
          </>
        )}

        {!inEU && (
          <NeonCard padding="sm">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-semibold">Nødnumre kan variere</div>
                <p className="text-sm text-muted-foreground">
                  Appen kan ikke verificere lokale nødnumre automatisk for dette
                  land. Brug officielle kilder nedenfor.
                </p>
              </div>
            </div>
          </NeonCard>
        )}

        {/* ------------------------------------------------------------
           AFSNIT 05 – Danske ambassader & officielle kilder
        ------------------------------------------------------------ */}
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">
          DANSKE AMBASSADER & OFFICIELLE KILDER
        </div>

        <NeonCard padding="sm">
          <a
            href="https://um.dk/rejse-og-ophold/ambassader-og-konsulater"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold">Find dansk ambassade</div>
              <div className="text-sm text-muted-foreground">
                Udenrigsministeriets oversigt
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </NeonCard>

        <NeonCard padding="sm">
          <a
            href="https://um.dk/rejse-og-ophold/rejsevejledninger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold">Rejsevejledninger</div>
              <div className="text-sm text-muted-foreground">
                Udenrigsministeriet
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </NeonCard>

        {/* ------------------------------------------------------------
           AFSNIT 06 – Søg nødnumre for destinationen (altid)
        ------------------------------------------------------------ */}
        <NeonCard padding="sm">
          <a
            href={`https://www.google.com/search?q=${googleQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold">Søg nødnumre for destinationen</div>
              <div className="text-sm text-muted-foreground">
                Google-søgning ({city || "destination"})
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </NeonCard>
      </main>
    </div>
  );
}

// ============================================================================
// AFSNIT 07 – Export
// ============================================================================
export default function Help() {
  return (
    <TripGuard>
      <HelpContent />
    </TripGuard>
  );
}
