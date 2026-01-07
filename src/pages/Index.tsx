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
    // Når start+slutdato er sat, beregn days automatisk.
    if (trip.startDate && trip.endDate) {
      const days = differenceInDays(trip.endDate, trip.startDate) + 1;
      if (days > 0 && days !== trip.days) {
        setTrip({ days });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.startDate, trip.endDate]);

  // --------------------------------------------------------------------------
  // AFSNIT 03 – Handlers
  // --------------------------------------------------------------------------
  const handleDestinationChange = (value: string, location?: LocationResult) => {
    // Hvis brugeren vælger fra listen (location findes),
    // så gem også land-info – uden gæt.
    if (location) {
      setTrip({
        destination: location.name || value,
        location,
        countryName: location.country,
        countryCode: location.countryCode,
      });
      return;
    }

    // Brugeren skriver bare tekst → ingen lat/lon og ingen land.
    setTrip({
      destination: value,
      location: undefined,
      countryName: undefined,
      countryCode: undefined,
    });
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
  // AFSNIT 04 – GPS helper (find by + land via reverse geocoding)
  // --------------------------------------------------------------------------
  const applyGpsTripAndGo = async (lat: number, lon: number) => {
    const now = new Date();

    // Reverse geocode for at få by/land (ingen gæt – kun hvis vi får data)
    const reverse = await reverseGeocodeAddress(lat, lon);

    const cityName =
      reverse?.city?.trim() ||
      // fallback: prøv at bruge første del af displayName hvis city mangler
      (reverse?.displayName ? reverse.displayName.split(",")[0].trim() : "") ||
      "Min lokation";

    // Byg et "minimalt men validt" LocationResult
    const gpsLocation: LocationResult = {
      id: "gps",
      name: cityName,
      displayName: reverse?.displayName || cityName,
      lat,
      lon,
      country: reverse?.country,
      countryCode: reverse?.countryCode,
      type: "gps",
    };

    setTrip({
      destination: cityName,
      location: gpsLocation,
      startDate: now,
      endDate: now,
      days: 1,
      countryName: reverse?.country,
      countryCode: reverse?.countryCode,
    });

    navigate("/menu");
  };

  const friendlyGpsError = (code?: number) => {
    // code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
    if (code === 1) return "Du har afvist GPS. Tillad lokation i browseren og prøv igen.";
    if (code === 2) return "GPS kunne ikke finde din position. Prøv igen om lidt.";
    if (code === 3) return "GPS tog for lang tid. Prøv igen.";
    return "GPS fejlede. Prøv igen.";
  };

  const handleUseGps = () => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("GPS understøttes ikke i denne browser.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await applyGpsTripAndGo(pos.coords.latitude, pos.coords.longitude);
        } catch {
          // Hvis reverse geocode fejler, så gem i det mindste lat/lon og gå videre.
          // (ingen gæt – bare fallback)
          const now = new Date();
          const fallbackLocation: LocationResult = {
            id: "gps",
            name: "Min lokation",
            displayName: "Min lokation",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            type: "gps",
          };

          setTrip({
            destination: "Min lokation",
            location: fallbackLocation,
            startDate: now,
            endDate: now,
            days: 1,
            countryName: undefined,
            countryCode: undefined,
          });

          navigate("/menu");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(friendlyGpsError(err?.code));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // --------------------------------------------------------------------------
  // AFSNIT 05 – UI
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      {/* Top bar */}
      <header className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-foreground">Neon Voyages</div>
            <div className="text-xs text-muted-foreground">Din rejseguide</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 space-y-6 pt-2">
        {/* Destination */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Hvor skal du hen?</h2>

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
            onClick={handleUseGps}
            disabled={gpsLoading}
          >
            <MapPin className="h-5 w-5 mr-2" />
            {gpsLoading ? "Finder GPS..." : "Brug min GPS (her og nu)"}
          </NeonButton>

          {gpsError && <p className="text-sm text-destructive">{gpsError}</p>}
        </section>

        {/* Datoer */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Hvornår rejser du?</h2>

          <DateRangePicker
            startDate={trip.startDate}
            endDate={trip.endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </section>

        {/* Days */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Antal dage</h2>
          <DaysStepper value={trip.days} onChange={handleDaysChange} />
          <p className="text-xs text-muted-foreground">
            Antal dage beregnes automatisk ud fra dine datoer
          </p>
        </section>

        {/* Continue */}
        <section className="pt-2">
          <NeonButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={!isValid || !hasLocation}
          >
            Fortsæt
          </NeonButton>
        </section>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Data fra OpenStreetMap / Nominatim
      </footer>
    </div>
  );
};

export default Index;
