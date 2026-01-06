// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, MapPin } from "lucide-react";
import { DestinationInput } from "@/components/DestinationInput";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DaysStepper } from "@/components/DaysStepper";
import { NeonButton } from "@/components/ui/NeonButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrip } from "@/context/TripContext";
import { type LocationResult, reverseGeocodeAddress } from "@/services/geocoding";
import { differenceInDays } from "date-fns";

// ============================================================================
// AFSNIT 01 – Component
// ============================================================================
const Index = () => {
  const navigate = useNavigate();
  const { trip, setTrip, isValid, hasLocation } = useTrip();

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // AFSNIT 02 – Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Sync days with date range
    if (trip.startDate && trip.endDate) {
      const calculatedDays = differenceInDays(trip.endDate, trip.startDate);
      if (calculatedDays > 0 && calculatedDays !== trip.days) {
        setTrip({ days: calculatedDays });
      }
    }
  }, [trip.startDate, trip.endDate, trip.days, setTrip]);

  // --------------------------------------------------------------------------
  // AFSNIT 03 – Handlers (destination + datoer + continue)
  // --------------------------------------------------------------------------
  const handleDestinationChange = (value: string, location?: LocationResult) => {
    setTrip({ destination: value, location });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setTrip({ startDate: date });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setTrip({ endDate: date });
  };

  const handleDaysChange = (days: number) => {
    setTrip({ days });
  };

  const handleContinue = () => {
    if (isValid && hasLocation) {
      navigate("/menu");
    }
  };

  // --------------------------------------------------------------------------
  // AFSNIT 04 – GPS “Her og nu” (robust + retry + stednavn)
  // --------------------------------------------------------------------------
  const resolveGpsPlaceName = async (lat: number, lon: number): Promise<string> => {
    // Vi bruger Nominatim reverse geocoding (ingen API-nøgle).
    // Hvis det fejler, falder vi tilbage til “Min lokation”.
    const rev = await reverseGeocodeAddress(lat, lon);

    const best =
      rev?.city ||
      rev?.suburb ||
      (rev?.displayName ? rev.displayName.split(",")[0]?.trim() : undefined);

    return best && best.length > 0 ? best : "Min lokation";
  };

  const applyGpsTripAndGo = async (lat: number, lon: number) => {
    const now = new Date();

    try {
      const placeName = await resolveGpsPlaceName(lat, lon);

      setTrip({
        destination: placeName,
        location: { lat, lon },
        startDate: now,
        endDate: now,
        days: 1,
      });

      setGpsError(null);
      navigate("/menu");
    } finally {
      // Hold loading aktiv indtil vi også har forsøgt at finde stednavn
      setGpsLoading(false);
    }
  };

  const friendlyGpsError = (code?: number) => {
    // code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
    if (code === 1) {
      return "GPS er blokeret. Tillad lokation i browseren (lås-ikonet i adresselinjen) og prøv igen.";
    }
    if (code === 2) {
      return "GPS kunne ikke finde din lokation. Tænd Windows Lokation, eller prøv igen på Wi-Fi.";
    }
    if (code === 3) {
      return "GPS tog for lang tid. Prøver igen… (tip: tænd Windows Lokation og prøv på Wi-Fi)";
    }
    return "Kunne ikke hente din lokation. Tillad GPS og prøv igen.";
  };

  const tryGetPosition = (
    options: PositionOptions,
    onSuccess: (pos: GeolocationPosition) => void,
    onError: (err: GeolocationPositionError) => void
  ) => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  };

  const handleUseGpsNow = async () => {
    if (!navigator.geolocation) {
      setGpsError("GPS understøttes ikke på denne enhed/browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    // 1) Hvis browseren understøtter Permissions API, så kan vi give bedre besked ved “denied”
    try {
      // @ts-expect-error: permissions kan mangle i nogle browsere
      const perm = await navigator.permissions?.query?.({ name: "geolocation" });
      if (perm?.state === "denied") {
        setGpsLoading(false);
        setGpsError(
          "GPS er blokeret i browseren. Klik på låsen ved adressen → Tillad lokation → prøv igen."
        );
        return;
      }
    } catch {
      // Ignorer – permissions API findes ikke overalt
    }

    // 2) Første forsøg: høj præcision (god på mobil, men kan timeoute på desktop)
    const optionsHigh: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // 3) Fallback: lavere præcision + længere timeout + cache (bedre på PC)
    const optionsFallback: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 600000, // 10 min cache er OK til “her og nu”
    };

    tryGetPosition(
      optionsHigh,
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // NOTE: loading slukkes inde i applyGpsTripAndGo (efter reverse geocode)
        void applyGpsTripAndGo(latitude, longitude);
      },
      (err) => {
        // Timeout / utilgængelig → prøv fallback én gang
        const msg = friendlyGpsError(err.code);
        setGpsError(msg);

        if (err.code === 2 || err.code === 3) {
          tryGetPosition(
            optionsFallback,
            (pos2) => {
              const { latitude, longitude } = pos2.coords;
              setGpsError(null);
              // NOTE: loading slukkes inde i applyGpsTripAndGo (efter reverse geocode)
              void applyGpsTripAndGo(latitude, longitude);
            },
            (err2) => {
              setGpsLoading(false);
              setGpsError(friendlyGpsError(err2.code));
            }
          );
          return;
        }

        // Permission denied eller andet
        setGpsLoading(false);
      }
    );
  };

  // --------------------------------------------------------------------------
  // AFSNIT 05 – Validation
  // --------------------------------------------------------------------------
  const getValidationMessage = () => {
    if (!trip.destination) {
      return "Vælg en destination for at fortsætte";
    }
    if (!hasLocation) {
      return "Vælg en destination fra forslagslisten";
    }
    if (!trip.startDate || !trip.endDate) {
      return "Vælg rejsedatoer for at fortsætte";
    }
    return "";
  };

  const canContinue = isValid && hasLocation;

  // --------------------------------------------------------------------------
  // AFSNIT 06 – UI
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-neon">Neon Voyages</h1>
            <p className="text-sm text-muted-foreground">Din rejseguide</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Form */}
      <main className="flex-1 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Hvor skal du hen?
          </h2>
          <DestinationInput
            value={trip.destination}
            onChange={handleDestinationChange}
            placeholder="Søg efter by eller land..."
          />
          {trip.destination && !hasLocation && (
            <p className="text-xs text-accent">
              Vælg en destination fra forslagslisten for at få præcise resultater
            </p>
          )}
        </section>

        {/* GPS Her og nu */}
        <section className="space-y-2">
          <NeonButton
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleUseGpsNow}
            disabled={gpsLoading}
          >
            <MapPin className="h-5 w-5 mr-2" />
            {gpsLoading ? "Finder din lokation..." : "Brug min GPS (her og nu)"}
          </NeonButton>

          {gpsError && (
            <p className="text-sm text-destructive text-center">{gpsError}</p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Hvornår rejser du?
          </h2>
          <DateRangePicker
            startDate={trip.startDate}
            endDate={trip.endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </section>

        <section>
          <DaysStepper value={trip.days} onChange={handleDaysChange} />
          <p className="text-xs text-muted-foreground mt-2">
            Antal dage beregnes automatisk ud fra dine datoer
          </p>
        </section>
      </main>

      {/* Continue Button */}
      <footer className="mt-8 pb-4">
        <NeonButton
          onClick={handleContinue}
          disabled={!canContinue}
          size="xl"
          className="w-full"
        >
          Fortsæt
        </NeonButton>
        {!canContinue && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            {getValidationMessage()}
          </p>
        )}
      </footer>
    </div>
  );
};

export default Index;
