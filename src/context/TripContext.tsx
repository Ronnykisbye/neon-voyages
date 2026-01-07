// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type LocationResult } from "@/services/geocoding";

// ============================================================================
// AFSNIT 01 – Typer
// ============================================================================
export interface TripState {
  destination: string;

  // Lat/Lon + evt. country fra geocoding (Nominatim)
  location?: LocationResult;

  // Rejsedatoer
  startDate?: Date;
  endDate?: Date;

  // Antal dage
  days: number;

  // NYT: Land-info (bruges senere til “Kun dette land”, nødnumre m.m.)
  countryName?: string; // fx "Denmark"
  countryCode?: string; // fx "dk" (ISO-2 i lowercase) – udfyldes senere mere præcist
}

interface TripContextValue {
  trip: TripState;
  setTrip: (trip: Partial<TripState>) => void;
  clearTrip: () => void;
  isValid: boolean;
  hasLocation: boolean;
}

// ============================================================================
// AFSNIT 02 – Storage keys (med backward-compat)
// ============================================================================
const STORAGE_KEY = "nv_trip";
const LEGACY_STORAGE_KEY = "ung-rejse-trip";

// ============================================================================
// AFSNIT 03 – Default state
// ============================================================================
const defaultTrip: TripState = {
  destination: "",
  location: undefined,
  startDate: undefined,
  endDate: undefined,
  days: 3,
  countryName: undefined,
  countryCode: undefined,
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

// ============================================================================
// AFSNIT 04 – Helpers (load/save + migration)
// ============================================================================
function safeParse(json: string): any | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function rehydrateDate(value: any): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Henter trip fra ny key først.
 * Hvis ikke findes: prøv legacy key og migrer til ny.
 */
function loadTripFromStorage(): TripState {
  try {
    const storedNew = localStorage.getItem(STORAGE_KEY);
    const storedLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);

    const raw = storedNew ?? storedLegacy;
    if (!raw) return defaultTrip;

    const parsed = safeParse(raw);
    if (!parsed) return defaultTrip;

    const startDate = rehydrateDate(parsed.startDate);
    const endDate = rehydrateDate(parsed.endDate);

    const location: LocationResult | undefined = parsed.location || undefined;

    // Country (robust fallback):
    const countryName: string | undefined =
      (typeof parsed.countryName === "string" && parsed.countryName.trim()) ||
      (typeof location?.country === "string" && location.country.trim()) ||
      undefined;

    // CountryCode: vi gemmer den hvis den findes i storage.
    // (Den bliver udfyldt mere præcist senere via reverse geocoding med country_code.)
    const countryCode: string | undefined =
      typeof parsed.countryCode === "string" && parsed.countryCode.trim()
        ? parsed.countryCode.trim().toLowerCase()
        : undefined;

    const trip: TripState = {
      destination: parsed.destination || "",
      location,
      startDate,
      endDate,
      days: typeof parsed.days === "number" ? parsed.days : 3,
      countryName,
      countryCode,
    };

    // MIGRATION: hvis vi læste fra legacy key, så skriv til ny key
    if (!storedNew && storedLegacy) {
      saveTripToStorage(trip);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    return trip;
  } catch {
    return defaultTrip;
  }
}

function saveTripToStorage(trip: TripState): void {
  try {
    const toStore = {
      destination: trip.destination,
      location: trip.location,
      startDate: trip.startDate?.toISOString(),
      endDate: trip.endDate?.toISOString(),
      days: trip.days,
      countryName: trip.countryName,
      countryCode: trip.countryCode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (err) {
    console.error("Failed to save trip data:", err);
  }
}

/**
 * Prøv at udlede landnavn fra en LocationResult.
 * (Lige nu har vi typisk kun countryName fra Nominatim search/reverse.)
 */
function deriveCountryNameFromLocation(loc?: LocationResult): string | undefined {
  if (!loc?.country) return undefined;
  const c = String(loc.country).trim();
  return c.length > 0 ? c : undefined;
}

// ============================================================================
// AFSNIT 05 – Provider
// ============================================================================
export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTripState] = useState<TripState>(() => loadTripFromStorage());

  // (Optional) Hvis vi senere får brug for at auto-save på ændringer, kan vi bruge useEffect.
  // Lige nu gemmer vi ved setTrip for minimal ændring og færre side-effekter.

  const setTrip = (updates: Partial<TripState>) => {
    setTripState((prev) => {
      const next: TripState = { ...prev, ...updates };

      // Hvis location opdateres, og der ikke er sat countryName eksplicit,
      // så udfyld countryName fra location.country (hvis den findes).
      if (updates.location && !updates.countryName) {
        const derived = deriveCountryNameFromLocation(updates.location);
        if (derived) next.countryName = derived;
      }

      saveTripToStorage(next);
      return next;
    });
  };

  const clearTrip = () => {
    setTripState(defaultTrip);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  // Check om trip er valid til at gå videre
  const isValid = Boolean(trip.destination && trip.startDate && trip.endDate);

  // Check om lat/lon er tilgængelig
  const hasLocation = Boolean(trip.location?.lat && trip.location?.lon);

  return (
    <TripContext.Provider value={{ trip, setTrip, clearTrip, isValid, hasLocation }}>
      {children}
    </TripContext.Provider>
  );
}

// ============================================================================
// AFSNIT 06 – Hook
// ============================================================================
export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
