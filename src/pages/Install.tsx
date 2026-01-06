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
  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) setDevice("ios");
    else if (/android/.test(ua)) setDevice("android");
    else setDevice("desktop");

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
    return () => window.removeEventListener("beforeinstallprompt", handler);
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

        {!isStandalone && deferredPrompt && device !== "ios" && (
          <NeonCard>
            <p className="mb-3">
              Installer Neon Voyages som en rigtig app.
            </p>
            <NeonButton onClick={handleInstall} className="w-full">
              Installer app
            </NeonButton>
          </NeonCard>
        )}

        {!isStandalone && device === "ios" && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på iPhone / iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tryk på <strong>Del</strong>-ikonet i Safari</li>
              <li>Vælg <strong>“Føj til hjemmeskærm”</strong></li>
              <li>Tryk <strong>Tilføj</strong></li>
            </ol>
          </NeonCard>
        )}

        {!isStandalone && device === "android" && !deferredPrompt && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på Android:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tryk på <strong>⋮</strong> (øverst i browseren)</li>
              <li>Vælg <strong>“Installer app”</strong> eller <strong>“Føj til startskærm”</strong></li>
              <li>Bekræft</li>
            </ol>
          </NeonCard>
        )}

        {!isStandalone && device === "desktop" && !deferredPrompt && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på PC / Mac:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Åbn browserens menu (<strong>⋮</strong>)</li>
              <li>Vælg <strong>“Installer Neon Voyages”</strong></li>
              <li>Appen åbner i sit eget vindue</li>
            </ol>
          </NeonCard>
        )}
      </main>
    </div>
  );
}
