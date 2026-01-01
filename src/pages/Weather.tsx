import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { loadTripData, type TripData } from "@/services/storage";

interface WeatherDay {
  date: Date;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
}

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

export default function Weather() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.startDate || !data.endDate || !data.location) {
      navigate("/");
      return;
    }
    setTripData(data);
    fetchWeather(data);
  }, [navigate]);

  const fetchWeather = async (data: TripData) => {
    if (!data.location) {
      setError("Ingen lokation fundet");
      setLoading(false);
      return;
    }

    try {
      const startDate = format(data.startDate!, "yyyy-MM-dd");
      const endDate = format(data.endDate!, "yyyy-MM-dd");

      // Open-Meteo is free and doesn't require API key
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${data.location.lat}&longitude=${data.location.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&start_date=${startDate}&end_date=${endDate}&timezone=auto`
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
  };

  if (!tripData) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Vejret"
        subtitle={tripData.destination}
      />

      <main className="flex-1 space-y-4 pb-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Henter vejrdata..." />
          </div>
        )}

        {error && (
          <NeonCard variant="accent" className="border-destructive/30">
            <p className="text-destructive">{error}</p>
          </NeonCard>
        )}

        {!loading && !error && weather.length > 0 && (
          <>
            {weather.map((day, index) => (
              <NeonCard
                key={day.date.toISOString()}
                variant={index === 0 ? "glow" : "default"}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(day.date, "EEEE", { locale: da })}
                    </p>
                    <p className="font-semibold text-foreground">
                      {format(day.date, "d. MMMM", { locale: da })}
                    </p>
                  </div>
                  {weatherIcons[day.weatherCode] || (
                    <Cloud className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {weatherDescriptions[day.weatherCode] || "Ukendt vejr"}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <div className="text-sm">
                      <span className="font-medium">{day.tempMax}°</span>
                      <span className="text-muted-foreground"> / {day.tempMin}°</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">{day.precipitation} mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{day.windSpeed} km/t</span>
                  </div>
                </div>
              </NeonCard>
            ))}

            <NeonCard padding="sm" className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kilde</span>
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open-Meteo (gratis API)
                </a>
              </div>
            </NeonCard>
          </>
        )}

        {!loading && !error && weather.length === 0 && (
          <NeonCard>
            <p className="text-muted-foreground">
              Ingen vejrdata tilgængelig for de valgte datoer.
            </p>
          </NeonCard>
        )}
      </main>
    </div>
  );
}
