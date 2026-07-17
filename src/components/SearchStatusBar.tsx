import { PacmanLoader } from "@/components/PacmanLoader";

type Props = {
  status: "idle" | "loading" | "empty" | "done";
  onRetry: () => void;
};

export default function SearchStatusBar({ status, onRetry }: Props) {
  if (status === "loading") {
    return (
      <div className="mb-4">
        <PacmanLoader
          title="Pac-Man leder efter steder i nærheden…"
          detail="Han søger i OpenStreetMap og gennemgår området."
        />
      </div>
    );
  }

  let text = "";
  if (status === "empty") {
    text = "❌ Ingen data fundet i dette område. OpenStreetMap kan mangle detaljer her.";
  } else if (status === "done") {
    text = "✅ Resultater fundet";
  }

  return (
    <div className="mb-4 rounded-xl border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>{text}</span>
        <button
          onClick={onRetry}
          className="rounded-lg bg-primary px-3 py-1 text-primary-foreground hover:opacity-90"
        >
          Søg igen
        </button>
      </div>
    </div>
  );
}
