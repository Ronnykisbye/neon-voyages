import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();

    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-ignore
        window.navigator.standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen px-4 py-2 max-w-lg mx-auto">
      <PageHeader
        title="Installer Neon Voyages"
        subtitle="Få appen direkte på din enhed"
      />

      <main className="space-y-4">
        {isStandalone && (
          <NeonCard>
            <p className="text-center font-semibold">
              ✅ Neon Voyages er allerede installeret
            </p>
          </NeonCard>
        )}

        {!isStandalone && deferredPrompt && !isIOS && (
          <NeonCard>
            <p className="mb-3">
              Installer Neon Voyages som en rigtig app på din enhed.
            </p>
            <NeonButton onClick={handleInstall} className="w-full">
              Installer app
            </NeonButton>
          </NeonCard>
        )}

        {!isStandalone && isIOS && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tryk på <strong>Del</strong>-ikonet i Safari</li>
              <li>Vælg <strong>“Føj til hjemmeskærm”</strong></li>
              <li>Tryk <strong>Tilføj</strong></li>
            </ol>
          </NeonCard>
        )}

        {!isStandalone && !deferredPrompt && !isIOS && (
          <NeonCard>
            <p className="text-sm text-muted-foreground">
              Tip: Brug browserens menu og vælg
              <strong> “Installer app”</strong> eller
              <strong> “Tilføj til startskærm”</strong>.
            </p>
          </NeonCard>
        )}
      </main>
    </div>
  );
}
