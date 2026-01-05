// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React from "react";



// ============================================================================
// AFSNIT 01 – Typer & konstanter
// ============================================================================
export type Scope = "nearby" | "dk";

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
  if (fromNew === "dk" || fromNew === "nearby") return fromNew;

  // fallback til legacy
  const fromLegacy = window.localStorage.getItem(LS_SCOPE_LEGACY_SPOTS);
  if (fromLegacy === "dk" || fromLegacy === "nearby") return fromLegacy;

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

  // Labels (så vi kan genbruge samme UI på flere sider)
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
  return (
    <div className="mt-3 grid grid-cols-1 gap-3">
      {/* ------------------------------------------------------------
         AFSNIT 05A – Radius
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
         AFSNIT 05B – Scope
      ------------------------------------------------------------ */}
      {showScope && (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="nv-scope">
            {scopeLabel}
          </label>

          <select
            id="nv-scope"
            className="w-52 rounded-lg border bg-background px-3 py-2 text-sm"
            value={scope}
            onChange={(e) => {
              const next = e.target.value === "dk" ? "dk" : "nearby";
              writeScope(next);
              onScopeChange?.(next);
            }}
          >
            <option value="nearby">Nærområde (kan krydse grænser)</option>
            <option value="dk">Kun Danmark</option>
          </select>
        </div>
      )}
    </div>
  );
}
