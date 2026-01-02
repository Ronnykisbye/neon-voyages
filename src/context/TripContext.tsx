import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type LocationResult } from "@/services/geocoding";

export interface TripState {
  destination: string;
  location?: LocationResult;
  startDate?: Date;
  endDate?: Date;
  days: number;
}

interface TripContextValue {
  trip: TripState;
  setTrip: (trip: Partial<TripState>) => void;
  clearTrip: () => void;
  isValid: boolean;
  hasLocation: boolean;
}

const STORAGE_KEY = "ung-rejse-trip";

const defaultTrip: TripState = {
  destination: "",
  location: undefined,
  startDate: undefined,
  endDate: undefined,
  days: 3,
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

function loadTripFromStorage(): TripState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultTrip;

    const parsed = JSON.parse(stored);
    
    // Rehydrate dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (parsed.startDate) {
      const d = new Date(parsed.startDate);
      if (!isNaN(d.getTime())) startDate = d;
    }
    
    if (parsed.endDate) {
      const d = new Date(parsed.endDate);
      if (!isNaN(d.getTime())) endDate = d;
    }

    return {
      destination: parsed.destination || "",
      location: parsed.location || undefined,
      startDate,
      endDate,
      days: typeof parsed.days === "number" ? parsed.days : 3,
    };
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (err) {
    console.error("Failed to save trip data:", err);
  }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTripState] = useState<TripState>(() => loadTripFromStorage());

  const setTrip = (updates: Partial<TripState>) => {
    setTripState((prev) => {
      const newTrip = { ...prev, ...updates };
      saveTripToStorage(newTrip);
      return newTrip;
    });
  };

  const clearTrip = () => {
    setTripState(defaultTrip);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Check if trip is valid for navigating to menu pages
  const isValid = Boolean(
    trip.destination &&
    trip.startDate &&
    trip.endDate
  );

  // Check if location (lat/lon) is available
  const hasLocation = Boolean(trip.location?.lat && trip.location?.lon);

  return (
    <TripContext.Provider value={{ trip, setTrip, clearTrip, isValid, hasLocation }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
