import React from "react";
import { Phone, Shield, Building2, Heart, ExternalLink, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { TripGuard } from "@/components/TripGuard";
import { TripDebug } from "@/components/TripDebug";
import { useTrip } from "@/context/TripContext";

const genericEmergency = [
  { label: "Nødhjælp (EU)", icon: <Phone className="h-6 w-6" />, number: "112", description: "Fælles nødnummer i EU - politi, brand, ambulance" },
  { label: "Politi", icon: <Shield className="h-6 w-6" />, number: "112", description: "Ring 112 for politi i de fleste lande" },
  { label: "Ambulance", icon: <Heart className="h-6 w-6" />, number: "112", description: "Ring 112 for akut lægehjælp i de fleste lande" },
];

function HelpContent() {
  const { trip } = useTrip();

  return (
    <div className="min-h-screen flex flex-col px-4 py-2 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Hjælp & Nødhjælp" subtitle={trip.destination} />

      <main className="flex-1 space-y-4 pb-6">
        <NeonCard variant="accent" className="border-accent/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-accent flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Vigtigt</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nødnumre varierer fra land til land. Tjek altid de officielle kilder for dit rejsemål før afrejse.
              </p>
            </div>
          </div>
        </NeonCard>

        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">Generelle nødnumre</h3>

        {genericEmergency.map((item) => (
          <NeonCard key={item.label} variant="interactive">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <a href={`tel:${item.number}`} className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-neon-primary hover:shadow-[0_0_35px_hsl(180_100%_60%/0.6)] transition-all active:scale-95">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </NeonCard>
        ))}

        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-4">Danske ambassader</h3>

        <NeonCard variant="interactive">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground flex-shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Find dansk ambassade</h3>
              <p className="text-sm text-muted-foreground">Udenrigsministeriets oversigt</p>
            </div>
          </div>
          <a href="https://um.dk/rejse-og-ophold/find-ambassade-eller-konsulat" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />
            Åbn um.dk
          </a>
        </NeonCard>

        <div className="space-y-3 pt-4">
          <a href="https://um.dk/rejse-og-ophold/rejse-til-udlandet/rejsevejledninger" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all">
            <div>
              <span className="font-medium">Rejsevejledninger</span>
              <p className="text-sm text-muted-foreground">Udenrigsministeriet</p>
            </div>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>

          <a href={`https://www.google.com/search?q=${encodeURIComponent(trip.destination + " emergency numbers")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-neon-primary hover:border-primary/50 transition-all">
            <div>
              <span className="font-medium">Søg nødnumre for destinationen</span>
              <p className="text-sm text-muted-foreground">Google søgning</p>
            </div>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>
        </div>
      </main>

      <TripDebug />
    </div>
  );
}

export default function Help() {
  return (
    <TripGuard>
      <HelpContent />
    </TripGuard>
  );
}
