// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React from "react";

// ============================================================================
// AFSNIT 01 – Typer & konstanter
// ============================================================================
export type Scope = "nearby" | "dk" | "country";

export const RADIUS_OPTIONS_KM = [2, 4, 6, 10, 20] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];

// ============================================================================
// AFSNIT 02 – localStorage keys (fælles)
//  - Ny fælles nøgle: nv_search_radius_km
//  - Legacy nøgle (fra TouristSpots): nv_spots_radius_km
// ============================================================================
const LS_RADIUS_NEW = "nv_search_radius_km";
const LS_RADIUS_LEGACY_SPOTS = "nv_spots_radius_km";

const LS_SCOPE_NEW = "nv_search_scope";
const LS_SCOPE_LEGACY_SPOTS = "nv_spots_scope";

const LS_TRIP = "nv_trip";

// ============================================================================
// AFSNIT 03 – Hjælpefunktioner (læse/skrive settings)
// ============================================================================
export function readRadiusKm(defaultKm: RadiusKm = 6): RadiusKm {
  const fromNew = Number(window.localStorage.getItem(LS_RADIUS_NEW));
  if (RADIUS_OPTIONS_KM.includes(fromNew as RadiusKm)) return fromNew as RadiusKm;

  // fallback til legacy
  const fromLegacy = Number(window.localStorage.getItem(LS_RADIUS_LEGACY_SPOTS));
  if (RADIUS_OPTIONS_KM.includes(fromLegacy as RadiusKm)) return fromLegacy as RadiusKm;

  return defaultKm;
}

export function writeRadiusKm(km: RadiusKm) {
  window.localStorage.setItem(LS_RADIUS_NEW, String(km));
  // skriv også legacy så gamle sider fortsætter med at “føle” korrekt
  window.localStorage.setItem(LS_RADIUS_LEGACY_SPOTS, String(km));
}

export function readScope(defaultScope: Scope = "nearby"): Scope {
  const fromNew = window.localStorage.getItem(LS_SCOPE_NEW);
  if (fromNew === "dk" || fromNew === "nearby" || fromNew === "country") return fromNew;

  // fallback til legacy
  const fromLegacy = window.localStorage.getItem(LS_SCOPE_LEGACY_SPOTS);
  if (fromLegacy === "dk" || fromLegacy === "nearby" || fromLegacy === "country") return fromLegacy;

  return defaultScope;
}

export function writeScope(scope: Scope) {
  window.localStorage.setItem(LS_SCOPE_NEW, scope);
  // skriv også legacy
  window.localStorage.setItem(LS_SCOPE_LEGACY_SPOTS, scope);
}

export function toMeters(km: number) {
  return Math.round(km * 1000);
}

// ---------------------------------------------------------------------------
// AFSNIT 03A – Læs land fra nv_trip (robust, ingen crash)
// ---------------------------------------------------------------------------
function readTripCountry(): { countryName?: string; countryCode?: string } {
  try {
    const raw = window.localStorage.getItem(LS_TRIP);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as any;

    const countryName = typeof parsed?.countryName === "string" ? parsed.countryName : undefined;
    const countryCode = typeof parsed?.countryCode === "string" ? parsed.countryCode : undefined;

    return { countryName, countryCode };
  } catch {
    return {};
  }
}

// ============================================================================
// AFSNIT 04 – Komponent props
// ============================================================================
type Props = {
  // Vis/Skjul kontroller
  showRadius?: boolean;
  showScope?: boolean;

  // Aktuelle værdier
  radiusKm: RadiusKm;
  scope?: Scope;

  // Callbacks (du styrer fetch i siden)
  onRadiusChange?: (km: RadiusKm) => void;
  onScopeChange?: (scope: Scope) => void;

  // Labels
  radiusLabel?: string;
  scopeLabel?: string;
};

// ============================================================================
// AFSNIT 05 – UI komponent
// ============================================================================
export default function SearchControls({
  showRadius = true,
  showScope = true,
  radiusKm,
  scope = "nearby",
  onRadiusChange,
  onScopeChange,
  radiusLabel = "Afstand:",
  scopeLabel = "Område:",
}: Props) {
  // -------------------------------------------------------------------------
  // AFSNIT 05A – Dynamisk land (fra nv_trip)
  // -------------------------------------------------------------------------
  const { countryName, countryCode } = readTripCountry();
  const isDK = (countryCode || "").toLowerCase() === "dk";

  // Hvis scope er "dk" men landet ikke er DK → fallback til nearby
  // (det er præcis det, der giver 0 resultater i Tokyo/Paris)
  const safeScope: Scope =
    scope === "dk" && countryCode && !isDK ? "nearby" : scope;

  // Dropdown-option for "kun land"
  // - DK: behold "dk" for backward compat
  // - Udland: brug "country"
  const countryOptionValue: Scope = isDK ? "dk" : "country";
  const countryOptionLabel = isDK
    ? "Kun Danmark"
    : countryName
      ? `Kun ${countryName}`
      : "Kun landet (din destination)";

  return (
    <div className="mt-3 grid grid-cols-1 gap-3">
      {/* ------------------------------------------------------------
         AFSNIT 05B – Radius
      ------------------------------------------------------------ */}
      {showRadius && (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="nv-radius">
            {radiusLabel}
          </label>

          <select
            id="nv-radius"
            className="w-52 rounded-lg border bg-background px-3 py-2 text-sm"
            value={radiusKm}
            onChange={(e) => {
              const next = Number(e.target.value) as RadiusKm;
              writeRadiusKm(next);
              onRadiusChange?.(next);
            }}
          >
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ------------------------------------------------------------
         AFSNIT 05C – Scope
      ------------------------------------------------------------ */}
      {showScope && (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="nv-scope">
            {scopeLabel}
          </label>

          <select
            id="nv-scope"
            className="w-52 rounded-lg border bg-background px-3 py-2 text-sm"
            value={safeScope}
            onChange={(e) => {
              const raw = e.target.value as Scope;
              const next: Scope =
                raw === "dk" ? "dk" : raw === "country" ? "country" : "nearby";

              writeScope(next);
              onScopeChange?.(next);
            }}
          >
            <option value="nearby">Nærområde (kan krydse grænser)</option>
            <option value={countryOptionValue}>{countryOptionLabel}</option>
          </select>
        </div>
      )}
    </div>
  );
}
