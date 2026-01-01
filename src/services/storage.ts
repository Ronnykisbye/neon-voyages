import { type LocationResult } from "./geocoding";

const STORAGE_KEYS = {
  destination: "ung-rejse-destination",
  location: "ung-rejse-location",
  startDate: "ung-rejse-start-date",
  endDate: "ung-rejse-end-date",
  days: "ung-rejse-days",
} as const;

export interface TripData {
  destination: string;
  location?: LocationResult;
  startDate?: Date;
  endDate?: Date;
  days: number;
}

export function saveTripData(data: Partial<TripData>): void {
  if (data.destination !== undefined) {
    localStorage.setItem(STORAGE_KEYS.destination, data.destination);
  }
  if (data.location !== undefined) {
    localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(data.location));
  }
  if (data.startDate !== undefined) {
    localStorage.setItem(STORAGE_KEYS.startDate, data.startDate.toISOString());
  }
  if (data.endDate !== undefined) {
    localStorage.setItem(STORAGE_KEYS.endDate, data.endDate.toISOString());
  }
  if (data.days !== undefined) {
    localStorage.setItem(STORAGE_KEYS.days, String(data.days));
  }
}

export function loadTripData(): TripData {
  const destination = localStorage.getItem(STORAGE_KEYS.destination) || "";
  
  let location: LocationResult | undefined;
  const locationStr = localStorage.getItem(STORAGE_KEYS.location);
  if (locationStr) {
    try {
      location = JSON.parse(locationStr);
    } catch {
      location = undefined;
    }
  }

  let startDate: Date | undefined;
  const startDateStr = localStorage.getItem(STORAGE_KEYS.startDate);
  if (startDateStr) {
    const parsed = new Date(startDateStr);
    if (!isNaN(parsed.getTime()) && parsed >= new Date()) {
      startDate = parsed;
    }
  }

  let endDate: Date | undefined;
  const endDateStr = localStorage.getItem(STORAGE_KEYS.endDate);
  if (endDateStr) {
    const parsed = new Date(endDateStr);
    if (!isNaN(parsed.getTime())) {
      endDate = parsed;
    }
  }

  const daysStr = localStorage.getItem(STORAGE_KEYS.days);
  const days = daysStr ? parseInt(daysStr, 10) : 3;

  return {
    destination,
    location,
    startDate,
    endDate,
    days: isNaN(days) ? 3 : days,
  };
}

export function clearTripData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
