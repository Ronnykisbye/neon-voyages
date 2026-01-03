import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export default function GlobalLoadingIndicator() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const isBusy = fetching + mutating > 0;

  if (!isBusy) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Indlæser"
      className="fixed left-0 top-0 z-[9999] w-full"
    >
      <div className="h-1 w-full bg-primary/20">
        <div className="h-1 w-1/2 animate-pulse bg-primary" />
      </div>
    </div>
  );
}
