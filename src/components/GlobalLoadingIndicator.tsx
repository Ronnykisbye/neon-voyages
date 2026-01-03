import { useEffect, useRef, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export default function GlobalLoadingIndicator() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const isBusy = fetching + mutating > 0;

  // Sørger for at indikatoren ikke "blinker" for hurtigt
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Hvis der hentes data, vis straks
    if (isBusy) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setVisible(true);
      return;
    }

    // Hvis hentning stopper: hold den synlig lidt længere (mere tydelig for brugeren)
    if (!isBusy && visible) {
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 600);
    }

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isBusy, visible]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Indlæser"
      className="fixed left-0 top-0 z-[9999] w-full"
    >
      {/* Tydelig baggrund, så den kan ses i light mode */}
      <div className="h-1 w-full bg-foreground/10">
        <div className="h-1 w-1/2 animate-pulse bg-foreground/70" />
      </div>

      {/* Lille tekstlabel (valgfri men tydelig) */}
      <div className="mx-auto mt-2 w-fit rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
        Henter data…
      </div>
    </div>
  );
}
