"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Query-string param used to deep-link / bookmark a specific slide. 1-indexed
 * because the rest of the UI ("Slide 3 of 12") is 1-indexed too.
 */
const PAGE_PARAM = "page";

export type SlideDeckProps = {
  children: React.ReactNode;
};

export function SlideDeck({ children }: SlideDeckProps) {
  const slides = Children.toArray(children).filter((c) => isValidElement(c));
  const [idx, setIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  // We skip the very first URL write so the deck doesn't immediately rewrite
  // the URL on mount (which would race the URL-→-idx sync below and briefly
  // strip `?page=N` out of the address bar before putting it back).
  const skipNextUrlWrite = useRef(true);

  const next = useCallback(
    () => setIdx((i) => Math.min(total - 1, i + 1)),
    [total],
  );
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inField) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggleFullscreen]);

  // URL → slide index. Runs on mount (handles refresh / bookmark) and again
  // on browser Back/Forward so popstate doesn't get out of sync with the UI.
  // The next URL-write effect is skipped once so we don't immediately
  // overwrite the param that just drove this navigation.
  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get(PAGE_PARAM);
      const parsed = raw ? Number.parseInt(raw, 10) : NaN;
      const target =
        Number.isFinite(parsed) && parsed >= 1
          ? Math.min(parsed - 1, total - 1)
          : 0;
      skipNextUrlWrite.current = true;
      setIdx(target);
    }
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [total]);

  // Slide index → URL. Uses replaceState so we don't pile up a history entry
  // for every dot the user clicks; Back still leaves the lesson cleanly.
  // `?page=1` is omitted on purpose — the bare URL means slide 1.
  useEffect(() => {
    if (skipNextUrlWrite.current) {
      skipNextUrlWrite.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (idx === 0) {
      params.delete(PAGE_PARAM);
    } else {
      params.set(PAGE_PARAM, String(idx + 1));
    }
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [idx]);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-buckeye-gray">
        This lesson has no slides yet.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-slidedeck-fullscreen={isFullscreen || undefined}
      className={
        isFullscreen ? "flex h-full flex-col bg-buckeye-cream" : "my-4"
      }
    >
      <div
        className={
          isFullscreen
            ? "flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8"
            : ""
        }
      >
        <div
          className={
            "rounded-2xl border border-black/5 bg-white shadow-card " +
            (isFullscreen
              ? "w-full max-w-5xl p-8 sm:p-12"
              : "p-6 sm:p-8")
          }
        >
          <div
            className={
              isFullscreen ? "min-h-[60vh]" : "min-h-[320px]"
            }
          >
            {slides[idx]}
          </div>
        </div>
      </div>

      <div
        className={
          "no-print flex items-center justify-between gap-3 " +
          (isFullscreen
            ? "border-t border-black/10 bg-white/90 px-6 py-3 backdrop-blur"
            : "mt-4")
        }
      >
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          className="focus-ring rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-40"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5"
            aria-label="Slide progress"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === idx ? "step" : undefined}
                className={
                  "h-2.5 rounded-full transition-all " +
                  (i === idx
                    ? "w-6 bg-buckeye-scarlet"
                    : "w-2.5 bg-black/15 hover:bg-black/30")
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5"
            aria-label={
              isFullscreen ? "Exit fullscreen (Esc)" : "Present fullscreen (F)"
            }
            title={
              isFullscreen ? "Exit fullscreen (Esc)" : "Present fullscreen (F)"
            }
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit" : "Present"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={idx === total - 1}
          className="focus-ring rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      {!isFullscreen ? (
        <div className="no-print mt-2 text-center text-xs text-buckeye-gray">
          Slide {idx + 1} of {total} · arrow keys to navigate, F for fullscreen
        </div>
      ) : null}
    </div>
  );
}
