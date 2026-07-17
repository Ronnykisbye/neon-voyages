import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function MobileScrollIndicator() {
  const [progress, setProgress] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const nextProgress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      setProgress(nextProgress);
      setHasMore(maxScroll > 80 && nextProgress < 0.985);
    };

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!hasMore) return null;

  return (
    <button
      type="button"
      className="mobile-scroll-indicator"
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.72, behavior: "smooth" })}
      aria-label="Der er mere indhold nedenunder. Rul ned."
      title="Mere nedenunder"
    >
      <span className="mobile-scroll-indicator__track" aria-hidden="true">
        <span className="mobile-scroll-indicator__thumb" style={{ top: `${progress * 72}%` }} />
      </span>
      <ChevronDown className="mobile-scroll-indicator__arrow" aria-hidden="true" />
    </button>
  );
}
