import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, MapPin } from "lucide-react";
import { DestinationInput } from "@/components/DestinationInput";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DaysStepper } from "@/components/DaysStepper";
import { NeonButton } from "@/components/ui/NeonButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrip } from "@/context/TripContext";
import { type LocationResult } from "@/services/geocoding";
import { differenceInDays } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { trip, setTrip, isValid, hasLocation } = useTrip();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    // Sync days with date range
    if (trip.startDate && trip.endDate) {
      const calculatedDays = differenceInDays(trip.endDate, trip.startDate);
      if (calculatedDays > 0 && calculatedDays !== trip.days) {
        setTrip({ days: calculatedDays });
      }
    }
  }, [trip.startDate, trip.endDate, trip.days, setTrip]);

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

  // ============================================================
  // AFSNIT – GPS “Her og nu”
  // ============================================================
  const handleUseGpsNow = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS understøttes ikke på denne enhed");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = new Date();

        setTrip({
          destination: "Min lokation",
          location: {
            lat: latitude,
            lon: longitude,
          },
          startDate: now,
          endDate: now,
          days: 1,
        });

        setGpsLoading(false);
        navigate("/menu"); // 👉 direkte videre
      },
      (error) => {
        setGpsLoading(false);
        setGpsError("Kunne ikke hente din lokation. Tillad GPS for at fortsætte.");
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // Show validation message based on what's missing
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

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-neon">Ung Rejse</h1>
            <p className="text-sm text-muted-foreground">Din rejseguide</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Form */}
      <main className="flex-1 space-y-6">
        {/* ================= Destination ================= */}
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

        {/* ================= GPS Her og nu ================= */}
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

        {/* ================= Dates ================= */}
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

        {/* ================= Days ================= */}
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
