import React, { useEffect, useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { da } from "date-fns/locale";
import {
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

interface WeatherDay {
  date: Date;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
}

const FORECAST_DAYS = 5; // ✅ FAST 5-DAGES PROGNOSE

const weatherIcons: Record<number, React.ReactNode> = {
  0: <Sun className="h-8 w-8 text-yellow-400" />,
  1: <Sun className="h-8 w-8 text-yellow-400" />,
  2: <CloudSun className="h-8 w-8 text-primary" />,
  3: <Cloud className="h-8 w-8 text-muted-foreground" />,
  45: <Cloud className="h-8 w-8 text-muted-foreground" />,
  48: <Cloud className="h-8 w-8 text-muted-foreground" />,
  51: <CloudRain className="h-8 w-8 text-blue-400" />,
  53: <CloudRain className="h-8 w-8 text-blue-400" />,
  55: <CloudRain className="h-8 w-8 text-blue-400" />,
  61: <CloudRain className="h-8 w-8 text-blue-400" />,
  63: <CloudRain className="h-8 w-8 text-blue-500" />,
  65: <CloudRain className="h-8 w-8 text-blue-600" />,
  71: <Snowflake className="h-8 w-8 text-blue-200" />,
  73: <Snowflake className="h-8 w-8 text-blue-200" />,
  75: <Snowflake className="h-8 w-8 text-blue-200" />,
  80: <CloudRain className="h-8 w-8 text-blue-400" />,
  81: <CloudRain className="h-8 w-8 text-blue-500" />,
  82: <CloudRain className="h-8 w-8 text-blue-600" />,
};

const weatherDescriptions: Record<number, string> = {
  0: "Klar himmel",
  1: "Hovedsageligt klart",
  2: "Delvist skyet",
  3: "Overskyet",
  45: "Tåge",
  48: "Rimtåge",
  51: "Let støvregn",
  53: "Moderat støvregn",
  55: "Kraftig støvregn",
  61: "Let regn",
  63: "Moderat regn",
  65: "Kraftig regn",
  71: "Let sne",
  73: "Moderat sne",
  75: "Kraftig sne",
  80: "Lette byger",
  81: "Moderate byger",
  82: "Kraftige byger",
};

function WeatherContent() {
  const { trip } = useTrip();
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!trip.location) {
      setError("Manglende lokation for at hente vejr");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const start = new Date(); // ALTID fra nu
      const end = addDays(start, FORECAST_DAYS - 1);

      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${trip.location.lat}&longitude=${trip.location.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&start_date=${startDate}&end_date=${endDate}&timezone=auto`
      );

      if (!response.ok) {
        throw new Error("Kunne ikke hente vejrdata");
      }

      const json = await response.json();

      const days: WeatherDay[] = json.daily.time.map(
        (date: string, i: number) => ({
          date: new Date(date),
          tempMax: Math.round(json.daily.temperature_2m_max[i]),
          tempMin: Math.round(json.daily.temperature_2m_min[i]),
          precipitation: json.daily.precipitation_sum[i],
          weatherCode: json.daily.weathercode[i],
          windSpeed: Math.round(json.daily.windspeed_10m_max[i]),
        })
      );

      setWeather(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  }, [trip.location]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Vejret" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        {loading && <p className="text-muted-foreground">Henter vejr…</p>}

        {!loading && error && (
          <NeonCard variant="accent">
            <p className="text-destructive text-center">{error}</p>
            <NeonButton onClick={fetchWeather} size="sm" className="mx-auto mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Prøv igen
            </NeonButton>
          </NeonCard>
        )}

        {!loading && !error &&
          weather.map((day) => (
            <NeonCard key={day.date.toISOString()} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(day.date, "EEEE", { locale: da })}
                  </p>
                  <p className="font-semibold">
                    {format(day.date, "d. MMMM", { locale: da })}
                  </p>
                </div>
                {weatherIcons[day.weatherCode] || <Cloud />}
              </div>

              <p className="text-sm text-muted-foreground">
                {weatherDescriptions[day.weatherCode] || "Ukendt vejr"}
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary" />
                  <span>
                    {day.tempMax}° / {day.tempMin}°
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-400" />
                  <span>{day.precipitation} mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  <span>{day.windSpeed} km/t</span>
                </div>
              </div>
            </NeonCard>
          ))}
      </main>

      <TripDebug />
    </div>
  );
}

export default function Weather() {
  return (
    <TripGuard>
      <WeatherContent />
    </TripGuard>
  );
}
