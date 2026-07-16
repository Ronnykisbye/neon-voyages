export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __neonInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function setupPwa() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__neonInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("neon-install-ready"));
  });

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    const reloadKey = "neon-pwa-update-reload";
    sessionStorage.removeItem(reloadKey);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js?v=${APP_VERSION}`, { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch((error) => {
          console.error("Service worker kunne ikke registreres:", error);
        });
    });
  }
}
import { APP_VERSION } from "@/config/appVersion";
