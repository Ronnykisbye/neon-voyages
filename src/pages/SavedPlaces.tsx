import { useMemo, useState } from "react";
import { Bookmark, BedDouble, Utensils } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StayResultCard } from "@/components/StayResultCard";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { cn } from "@/lib/utils";
import type { StayCategory } from "@/services/overpass";

type Filter = "all" | StayCategory;

export default function SavedPlaces() {
  const { places } = useSavedPlaces();
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(
    () => filter === "all" ? places : places.filter((place) => place.category === filter),
    [filter, places]
  );

  return (
    <div className="min-h-screen px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Gemte steder" subtitle={places.length + " gemt på denne enhed"} />

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-1.5">
          {([
            ["all", <Bookmark className="h-4 w-4" />, "Alle"],
            ["hotel", <BedDouble className="h-4 w-4" />, "Hoteller"],
            ["restaurant", <Utensils className="h-4 w-4" />, "Mad"],
          ] as const).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold",
                filter === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <div className="grid gap-4">
            {visible.map((place, index) => (
              <StayResultCard key={place.id} place={place} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-10 text-center">
            <Bookmark className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="font-bold">Ingen gemte steder endnu</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Åbn et hotel eller en restaurant og tryk på “Gem sted”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
