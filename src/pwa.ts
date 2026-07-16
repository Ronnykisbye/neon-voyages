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
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch((error) => {
          console.error("Service worker kunne ikke registreres:", error);
        });
    });
  }
}
