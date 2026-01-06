import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";

/* =========================================================
   AFSNIT 01 – Typer og konstanter
========================================================= */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const LS_INSTALLED_FLAG = "nv_pwa_installed";

/* =========================================================
   AFSNIT 02 – Hjælpere
========================================================= */

function detectDevice(): "ios" | "android" | "desktop" {
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore (iOS Safari legacy)
    window.navigator.standalone === true
  );
}

/* =========================================================
   AFSNIT 03 – Component
========================================================= */

export default function Install() {
  const navigate = useNavigate();

  const device = useMemo(() => detectDevice(), []);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // “standalone” = åbnet som app-vindue
  const [standalone, setStandalone] = useState(false);

  // “installedFlag” = vi ved, at appen er installeret (også hvis man står i browser bagefter)
  const [installedFlag, setInstalledFlag] = useState(false);

  useEffect(() => {
    // Læs flag, så siden kan vise “installeret” på senere besøg
    setInstalledFlag(localStorage.getItem(LS_INSTALLED_FLAG) === "1");
    setStandalone(isStandaloneMode());

    /* ---------------------------------------------------------
       AFSNIT 03A – beforeinstallprompt (Android/Edge/Chrome)
    --------------------------------------------------------- */
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    /* ---------------------------------------------------------
       AFSNIT 03B – appinstalled (når installation sker)
       Gem flag i localStorage, så vi kan vise success også i browser-fanen.
    --------------------------------------------------------- */
    const installedHandler = () => {
      localStorage.setItem(LS_INSTALLED_FLAG, "1");
      setInstalledFlag(true);
    };

    /* ---------------------------------------------------------
       AFSNIT 03C – opdater “standalone” hvis display-mode ændrer sig
    --------------------------------------------------------- */
    const mql = window.matchMedia("(display-mode: standalone)");
    const displayModeHandler = () => setStandalone(isStandaloneMode());

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", installedHandler);

    // Safari/ældre håndterer ikke altid addEventListener på MediaQueryList
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", displayModeHandler);
    } else {
      // @ts-ignore
      mql.addListener(displayModeHandler);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      window.removeEventListener("appinstalled", installedHandler);

      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", displayModeHandler);
      } else {
        // @ts-ignore
        mql.removeListener(displayModeHandler);
      }
    };
  }, []);

  /* =========================================================
     AFSNIT 04 – Handling: Installér
     Hvis brugeren accepterer, sætter vi flag optimistisk.
     (Edge/Chrome fyrer typisk appinstalled kort efter)
  ========================================================= */
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice?.outcome === "accepted") {
      localStorage.setItem(LS_INSTALLED_FLAG, "1");
      setInstalledFlag(true);
    }

    setDeferredPrompt(null);
  };

  /* =========================================================
     AFSNIT 05 – UI-tilstande
  ========================================================= */
  const showSuccess = standalone || installedFlag;

  return (
    <div className="min-h-screen px-4 py-2 max-w-lg mx-auto">
      <PageHeader
        title="Installer Neon Voyages"
        subtitle="Få appen direkte på din enhed"
      />

      <main className="space-y-4">
        {/* =======================================================
            AFSNIT 05A – Success state
        ======================================================== */}
        {showSuccess && (
          <NeonCard>
            <p className="text-center font-semibold">✅ Neon Voyages er installeret</p>

            <p className="text-sm text-muted-foreground text-center mt-2">
              Åbn appen fra dit ikon — eller tryk{" "}
              <strong>“Åbn i app”</strong> i browseren, hvis du ser knappen øverst.
            </p>

            <div className="mt-4">
              <NeonButton className="w-full" onClick={() => navigate("/menu")}>
                Gå til Menu
              </NeonButton>
            </div>
          </NeonCard>
        )}

        {/* =======================================================
            AFSNIT 05B – Install-knap (når browseren tillader det)
        ======================================================== */}
        {!showSuccess && deferredPrompt && device !== "ios" && (
          <NeonCard>
            <p className="mb-3">Installer Neon Voyages som en rigtig app.</p>
            <NeonButton onClick={handleInstall} className="w-full">
              Installer app
            </NeonButton>
          </NeonCard>
        )}

        {/* =======================================================
            AFSNIT 05C – iPhone/iPad guide
        ======================================================== */}
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

        {/* =======================================================
            AFSNIT 05D – Android guide (hvis prompt ikke vises)
        ======================================================== */}
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

        {/* =======================================================
            AFSNIT 05E – Desktop guide (hvis prompt ikke vises)
        ======================================================== */}
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
