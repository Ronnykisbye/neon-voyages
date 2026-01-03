import React, { useState } from "react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import {
  CloudSun,
  Landmark,
  Sparkles,
  Utensils,
  Calendar as CalendarIcon,
  ShoppingBag,
  Bus,
  LifeBuoy,
  MapPin,
  Calendar,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { MenuButton } from "@/components/MenuButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    icon: <CalendarIcon className="h-6 w-6" />,
    label: "Lokale tips",
    description: "Events & kulturkalender",
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

function MenuContent() {
  const { trip, clearTrip } = useTrip();
  const navigate = useNavigate();

  const dateRange =
    trip.startDate && trip.endDate
      ? `${format(trip.startDate, "d. MMM", { locale: da })} - ${format(
          trip.endDate,
          "d. MMM yyyy",
          { locale: da }
        )}`
      : "";

  const handleClearTrip = () => {
    clearTrip();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Ung Rejse" showBack={true} backTo="/" />

      {/* Trip Summary */}
      <NeonCard variant="glow" className="mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {trip.destination}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
              <span>•</span>
              <span>
                {trip.days} {trip.days === 1 ? "dag" : "dage"}
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

        {/* Reset Trip Button */}
        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <NeonButton
                variant="ghost"
                size="default"
                className="w-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Nulstil rejse
              </NeonButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Nulstil rejse?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil slette alle rejsedata og sende dig tilbage til forsiden. 
                  Denne handling kan ikke fortrydes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuller</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearTrip}>
                  Nulstil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>

      <TripDebug />
    </div>
  );
}

export default function Menu() {
  return (
    <TripGuard>
      <MenuContent />
    </TripGuard>
  );
}
