import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop");
  const [isStandalone, setIsStandalone] = useState(false);

  // ✅ NYT: vi kan vise “installeret!” selv om brugeren stadig er i browser-fanen
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) setDevice("ios");
    else if (/android/.test(ua)) setDevice("android");
    else setDevice("desktop");

    const calcStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true;

    setIsStandalone(calcStandalone());

    // A) Fanger “klar til install”-prompt (Android/Edge/Chrome)
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // B) Fanger når appen faktisk er installeret
    const installedHandler = () => {
      setJustInstalled(true);
      // Når install sker, kan nogle browsere stadig være i browser-tab.
      // Vi gemmer det som en “success state”.
    };

    // C) Hvis brugeren åbner den installerede app (standalone), opdater state
    const displayModeHandler = () => {
      setIsStandalone(calcStandalone());
    };

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", installedHandler);
    window.matchMedia("(display-mode: standalone)").addEventListener("change", displayModeHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      window.removeEventListener("appinstalled", installedHandler);
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", displayModeHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    // Hvis brugeren accepterer, venter vi på appinstalled-eventet.
    // Men vi rydder prompten uanset.
    if (choice?.outcome === "accepted") {
      // Edge/Chrome fyrer typisk "appinstalled" kort efter
    }

    setDeferredPrompt(null);
  };

  // Hvis appen er standalone, eller hvis vi lige har installeret, vis success.
  const showSuccess = isStandalone || justInstalled;

  return (
    <div className="min-h-screen px-4 py-2 max-w-lg mx-auto">
      <PageHeader
        title="Installer Neon Voyages"
        subtitle="Få appen direkte på din enhed"
      />

      <main className="space-y-4">
        {showSuccess && (
          <NeonCard>
            <p className="text-center font-semibold">✅ Neon Voyages er installeret</p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Du kan nu åbne appen fra dit ikon (Start / Dock / Hjemmeskærm).
            </p>

            <div className="mt-4">
              <NeonButton className="w-full" onClick={() => navigate("/menu")}>
                Gå til Menu
              </NeonButton>
            </div>
          </NeonCard>
        )}

        {!showSuccess && deferredPrompt && device !== "ios" && (
          <NeonCard>
            <p className="mb-3">Installer Neon Voyages som en rigtig app.</p>
            <NeonButton onClick={handleInstall} className="w-full">
              Installer app
            </NeonButton>
          </NeonCard>
        )}

        {!showSuccess && device === "ios" && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på iPhone / iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tryk på <strong>Del</strong>-ikonet i Safari</li>
              <li>Vælg <strong>“Føj til hjemmeskærm”</strong></li>
              <li>Tryk <strong>Tilføj</strong></li>
            </ol>
          </NeonCard>
        )}

        {!showSuccess && device === "android" && !deferredPrompt && (
          <NeonCard>
            <p className="font-semibold mb-2">Sådan installerer du på Android:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tryk på <strong>⋮</strong> (øverst i browseren)</li>
              <li>
                Vælg <strong>“Installer app”</strong> eller{" "}
                <strong>“Føj til startskærm”</strong>
              </li>
              <li>Bekræft</li>
            </ol>
          </NeonCard>
        )}

        {!showSuccess && device === "desktop" && !deferredPrompt && (
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
