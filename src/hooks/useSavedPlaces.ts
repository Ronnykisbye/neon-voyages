import { useCallback, useEffect, useState } from "react";
import type { PlaceResult } from "@/services/places";

const STORAGE_KEY = "neon-voyages-saved-places-v1";
const CHANGE_EVENT = "neon-voyages-saved-places-change";

export type SavedPlace = Omit<PlaceResult, "reviews"> & { savedAt: string };

function readSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((place) => place && typeof place.id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSavedPlaces(places: SavedPlace[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(readSavedPlaces);

  useEffect(() => {
    const sync = () => setPlaces(readSavedPlaces());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback(
    (id: string) => places.some((place) => place.id === id),
    [places]
  );

  const toggleSaved = useCallback((place: PlaceResult) => {
    const current = readSavedPlaces();
    if (current.some((saved) => saved.id === place.id)) {
      writeSavedPlaces(current.filter((saved) => saved.id !== place.id));
      return;
    }

    const { reviews: _reviews, ...lightPlace } = place;
    writeSavedPlaces([
      { ...lightPlace, savedAt: new Date().toISOString() },
      ...current,
    ].slice(0, 100));
  }, []);

  return { places, isSaved, toggleSaved };
}
