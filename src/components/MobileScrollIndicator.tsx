import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MobileScrollIndicator() {
  const [progress, setProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const nextProgress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      setProgress(nextProgress);
      setIsScrollable(maxScroll > 80);
      setAtBottom(nextProgress >= 0.985);
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

  if (!isScrollable) return null;

  const label = atBottom ? "Tilbage til toppen" : "Der er mere indhold nedenunder. Rul ned.";

  return (
    <button
      type="button"
      className="mobile-scroll-indicator"
      onClick={() =>
        atBottom
          ? window.scrollTo({ top: 0, behavior: "smooth" })
          : window.scrollBy({ top: window.innerHeight * 0.72, behavior: "smooth" })
      }
      aria-label={label}
      title={label}
    >
      <span className="mobile-scroll-indicator__track" aria-hidden="true">
        <span className="mobile-scroll-indicator__thumb" style={{ top: `${progress * 72}%` }} />
      </span>
      {atBottom ? (
        <ChevronUp className="mobile-scroll-indicator__arrow" aria-hidden="true" />
      ) : (
        <ChevronDown className="mobile-scroll-indicator__arrow" aria-hidden="true" />
      )}
    </button>
  );
}
