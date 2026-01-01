import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import { DestinationInput } from "@/components/DestinationInput";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DaysStepper } from "@/components/DaysStepper";
import { NeonButton } from "@/components/ui/NeonButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadTripData, saveTripData, type TripData } from "@/services/storage";
import { type LocationResult } from "@/services/geocoding";
import { differenceInDays } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData>(() => loadTripData());

  const isValid =
    tripData.destination.length > 0 &&
    tripData.startDate !== undefined &&
    tripData.endDate !== undefined;

  useEffect(() => {
    // Sync days with date range
    if (tripData.startDate && tripData.endDate) {
      const calculatedDays = differenceInDays(tripData.endDate, tripData.startDate);
      if (calculatedDays > 0 && calculatedDays !== tripData.days) {
        setTripData((prev) => ({ ...prev, days: calculatedDays }));
      }
    }
  }, [tripData.startDate, tripData.endDate]);

  const handleDestinationChange = (value: string, location?: LocationResult) => {
    const newData = { ...tripData, destination: value, location };
    setTripData(newData);
    saveTripData({ destination: value, location });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    const newData = { ...tripData, startDate: date };
    setTripData(newData);
    if (date) saveTripData({ startDate: date });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    const newData = { ...tripData, endDate: date };
    setTripData(newData);
    if (date) saveTripData({ endDate: date });
  };

  const handleDaysChange = (days: number) => {
    const newData = { ...tripData, days };
    setTripData(newData);
    saveTripData({ days });
  };

  const handleContinue = () => {
    if (isValid) {
      navigate("/menu");
    }
  };

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
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Hvor skal du hen?
          </h2>
          <DestinationInput
            value={tripData.destination}
            onChange={handleDestinationChange}
            placeholder="Søg efter by eller land..."
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Hvornår rejser du?
          </h2>
          <DateRangePicker
            startDate={tripData.startDate}
            endDate={tripData.endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </section>

        <section>
          <DaysStepper value={tripData.days} onChange={handleDaysChange} />
          <p className="text-xs text-muted-foreground mt-2">
            Antal dage beregnes automatisk ud fra dine datoer
          </p>
        </section>
      </main>

      {/* Continue Button */}
      <footer className="mt-8 pb-4">
        <NeonButton
          onClick={handleContinue}
          disabled={!isValid}
          size="xl"
          className="w-full"
        >
          Fortsæt
        </NeonButton>
        {!isValid && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Udfyld destination og datoer for at fortsætte
          </p>
        )}
      </footer>
    </div>
  );
};

export default Index;
