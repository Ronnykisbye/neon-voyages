// =====================================================
// AFSNIT 01 – Imports
// =====================================================
import { ExternalLink, Phone, AlertTriangle, Info } from "lucide-react";
import { useTrip } from "@/context/TripContext";

// =====================================================
// AFSNIT 02 – Hjælpefunktioner
// =====================================================
function isEU(countryCode?: string) {
  if (!countryCode) return false;
  return [
    "dk","se","no","fi","de","fr","es","it","nl","be","pl","pt",
    "ie","at","cz","sk","hu","si","hr","ro","bg","ee","lv","lt",
    "lu","mt","cy","gr"
  ].includes(countryCode.toLowerCase());
}

function googleSearch(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// =====================================================
// AFSNIT 03 – Component
// =====================================================
export default function Help() {
  const { trip } = useTrip();

  const city = trip?.location?.name;
  const country = trip?.location?.country;
  const countryCode = trip?.location?.countryCode;

  const inEU = isEU(countryCode);

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* AFSNIT 04 – Vigtig advarsel */}
      {/* ================================================= */}
      <div className="rounded-xl border border-red-300 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Vigtigt</p>
            <p className="text-sm text-red-700">
              Nødnumre varierer fra land til land. Tjek altid officielle kilder
              for dit rejsemål.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* AFSNIT 05 – EU information */}
      {/* ================================================= */}
      {inEU && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Phone className="h-4 w-4" />
            Nødhjælp i EU
          </div>
          <p className="text-sm text-muted-foreground">
            I EU kan du ringe <strong>112</strong> for politi, brand og ambulance.
          </p>
        </div>
      )}

      {/* ================================================= */}
      {/* AFSNIT 06 – Ikke-EU information */}
      {/* ================================================= */}
      {!inEU && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4" />
            Nødnumre kan variere
          </div>
          <p className="text-sm text-muted-foreground">
            Appen kan ikke verificere lokale nødnumre automatisk for dette land.
            Brug officielle kilder nedenfor.
          </p>
        </div>
      )}

      {/* ================================================= */}
      {/* AFSNIT 07 – Danske ambassader & officielle kilder */}
      {/* ================================================= */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Danske ambassader & officielle kilder
        </h2>

        <a
          href="https://um.dk/rejse-og-ophold"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition"
        >
          <div>
            <p className="font-medium">Find dansk ambassade</p>
            <p className="text-sm text-muted-foreground">
              Udenrigsministeriets oversigt
            </p>
          </div>
          <ExternalLink className="h-4 w-4" />
        </a>

        <a
          href={`https://um.dk/rejse-og-ophold/rejse-til-${countryCode ?? ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition"
        >
          <div>
            <p className="font-medium">Rejsevejledninger</p>
            <p className="text-sm text-muted-foreground">
              Udenrigsministeriet
            </p>
          </div>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* ================================================= */}
      {/* AFSNIT 08 – Smarte automatiske søgninger */}
      {/* ================================================= */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Søg officielle nødnumre
        </h2>

        <a
          href={googleSearch(`official emergency numbers ${city} ${country}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition"
        >
          <div>
            <p className="font-medium">Officielle nødnumre</p>
            <p className="text-sm text-muted-foreground">
              {city}, {country}
            </p>
          </div>
          <ExternalLink className="h-4 w-4" />
        </a>

        <a
          href={googleSearch(`police emergency number ${city} ${country} government`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition"
        >
          <div>
            <p className="font-medium">Politi – officiel kilde</p>
            <p className="text-sm text-muted-foreground">
              Regering / myndighed
            </p>
          </div>
          <ExternalLink className="h-4 w-4" />
        </a>

        <a
          href={googleSearch(`ambulance emergency number ${country} official`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition"
        >
          <div>
            <p className="font-medium">Ambulance / lægehjælp</p>
            <p className="text-sm text-muted-foreground">
              Officielle sundhedsmyndigheder
            </p>
          </div>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

    </div>
  );
}
