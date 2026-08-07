import { useState } from "react";
import { LocateFixed, Toilet, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function ToiletQuickMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (location.pathname === "/toilet-nearby") return null;

  const goToToilets = (locateNow: boolean) => {
    setOpen(false);
    navigate(locateNow ? "/toilet-nearby?locate=1" : "/toilet-nearby");
  };

  return (
    <div className="fixed right-4 bottom-20 z-[70] flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-2xl border border-primary/25 bg-card/95 p-3 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">🚻 Toilet</p>
              <p className="text-xs text-muted-foreground">Hurtig hjælp, uanset hvor du er</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Luk toiletmenu"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => goToToilets(true)}
              className="flex min-h-12 items-center gap-3 rounded-xl bg-primary px-3 text-left text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            >
              <LocateFixed className="h-5 w-5 shrink-0" />
              <span>
                Find nærmeste nu
                <span className="block text-xs font-normal opacity-85">Bruger din GPS efter tilladelse</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => goToToilets(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl border bg-background/70 px-3 text-left text-sm font-medium hover:bg-muted"
            >
              <Toilet className="h-5 w-5 shrink-0 text-primary" />
              Åbn toiletsiden
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Åbn hurtigmenu til offentlige toiletter"
        className="group flex min-h-14 items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-4 font-semibold text-foreground shadow-xl shadow-primary/15 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-primary/25"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Toilet className="h-5 w-5" />
        </span>
        <span className="pr-1 text-sm">Toilet</span>
      </button>
    </div>
  );
}
