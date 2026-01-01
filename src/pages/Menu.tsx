import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import {
  CloudSun,
  Landmark,
  Sparkles,
  Utensils,
  PartyPopper,
  ShoppingBag,
  Bus,
  LifeBuoy,
  MapPin,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MenuButton } from "@/components/MenuButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { loadTripData, type TripData } from "@/services/storage";

const menuItems = [
  {
    icon: <CloudSun className="h-6 w-6" />,
    label: "Vejret",
    description: "Vejrudsigt for din rejse",
    to: "/weather",
    variant: "primary" as const,
  },
  {
    icon: <Landmark className="h-6 w-6" />,
    label: "Seværdigheder",
    description: "Populære turistattraktioner",
    to: "/tourist-spots",
    variant: "primary" as const,
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    label: "Skjulte perler",
    description: "Unikke oplevelser",
    to: "/hidden-gems",
    variant: "accent" as const,
  },
  {
    icon: <Utensils className="h-6 w-6" />,
    label: "Spisesteder",
    description: "Mad og restauranter",
    to: "/food",
    variant: "primary" as const,
  },
  {
    icon: <PartyPopper className="h-6 w-6" />,
    label: "Begivenheder",
    description: "Events i perioden",
    to: "/events",
    variant: "accent" as const,
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    label: "Markeder",
    description: "Lokale markeder",
    to: "/markets",
    variant: "secondary" as const,
  },
  {
    icon: <Bus className="h-6 w-6" />,
    label: "Transport",
    description: "Offentlig transport",
    to: "/transport",
    variant: "secondary" as const,
  },
  {
    icon: <LifeBuoy className="h-6 w-6" />,
    label: "Hjælp",
    description: "Nødhjælp og kontakter",
    to: "/help",
    variant: "primary" as const,
  },
];

export default function Menu() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);

  useEffect(() => {
    const data = loadTripData();
    if (!data.destination || !data.startDate || !data.endDate) {
      navigate("/");
      return;
    }
    setTripData(data);
  }, [navigate]);

  if (!tripData) {
    return null;
  }

  const dateRange =
    tripData.startDate && tripData.endDate
      ? `${format(tripData.startDate, "d. MMM", { locale: da })} - ${format(
          tripData.endDate,
          "d. MMM yyyy",
          { locale: da }
        )}`
      : "";

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Ung Rejse" showBack={true} />

      {/* Trip Summary */}
      <NeonCard variant="glow" className="mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {tripData.destination}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
              <span>•</span>
              <span>
                {tripData.days} {tripData.days === 1 ? "dag" : "dage"}
              </span>
            </div>
          </div>
        </div>
      </NeonCard>

      {/* Menu Grid */}
      <main className="flex-1 space-y-3 pb-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Udforsk
        </h3>
        {menuItems.map((item) => (
          <MenuButton
            key={item.to}
            icon={item.icon}
            label={item.label}
            description={item.description}
            to={item.to}
            variant={item.variant}
          />
        ))}
      </main>
    </div>
  );
}
