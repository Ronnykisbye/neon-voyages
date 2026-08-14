// ============================================================================
// AFSNIT 00 – Imports
// ============================================================================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Plane, MapPin, Toilet } from "lucide-react";
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

  useEffect(() => {
    if (trip.startDate && trip.endDate) {
      const days = differenceInDays(trip.endDate, trip.startDate) + 1;
      if (days > 0 && days !== trip.days) {
        setTrip({ days });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.startDate, trip.endDate]);

  const handleDestinationChange = (value: string, location?: LocationResult) => {
    if (location) {
      setTrip({
        destination: location.name || value,
        location,
        countryName: location.country,
        countryCode: location.countryCode,
      });
      return;
    }

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

  const applyGpsTripAndGo = async (lat: number, lon: number) => {
    const now = new Date();
    const reverse = await reverseGeocodeAddress(lat, lon);

    const cityName =
      reverse?.city?.trim() ||
      (reverse?.displayName ? reverse.displayName.split(",")[0].trim() : "") ||
      "Min lokation";

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
    if (code === 1) return "Du har afvist GPS. Tillad lokation i browseren og prøv igen.";
    if (code === 2) return "GPS kunne ikke finde din position. Prøv igen om lidt.";
    if (code === 3) return "GPS tog for lang tid. Prøv igen.";
    return "GPS fejlede. Prøv igen.";
  };

  const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const handleUseGps = async () => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("GPS understøttes ikke i denne browser.");
      return;
    }

    setGpsLoading(true);

    try {
      const pos = await getPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });

      await applyGpsTripAndGo(pos.coords.latitude, pos.coords.longitude);
    } catch (err: any) {
      const code = err?.code as number | undefined;

      if (code === 2 || code === 3) {
        try {
          const pos2 = await getPosition({
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 0,
          });

          await applyGpsTripAndGo(pos2.coords.latitude, pos2.coords.longitude);
        } catch (err2: any) {
          setGpsError(friendlyGpsError(err2?.code));
        }
      } else {
        setGpsError(friendlyGpsError(code));
      }
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/toilet-nearby")}
            aria-label="Find offentligt toilet"
            title="Toilet nær mig"
            className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-primary shadow-card hover:shadow-neon-primary hover:border-primary/50 transition-all active:scale-95 cursor-pointer"
          >
            <Toilet className="h-5 w-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 space-y-6 pt-2">
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

          <NeonButton
            variant="ghost"
            size="lg"
            className="w-full border border-primary/25"
            onClick={() => navigate("/car-overnight")}
          >
            <Car className="h-5 w-5 mr-2" />
            Find et sted at overnatte i bilen
          </NeonButton>

          {gpsError && <p className="text-sm text-destructive">{gpsError}</p>}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Hvornår rejser du?</h2>

          <DateRangePicker
            startDate={trip.startDate}
            endDate={trip.endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Antal dage</h2>
          <DaysStepper value={trip.days} onChange={handleDaysChange} />
          <p className="text-xs text-muted-foreground">
            Antal dage beregnes automatisk ud fra dine datoer
          </p>
        </section>

        <section className="pt-2">
          <NeonButton
            variant="default"
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
