"use client";

import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
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

type DotItem =
  | { kind: "dot"; idx: number }
  | { kind: "ellipsis"; side: "left" | "right" };

/**
 * Pagination-style window for the slide-progress dots. Long decks (>7 slides)
 * collapse the dots that are far from the current slide into a `…` so the
 * controls bar fits on a phone. Returns: first slide, optional ellipsis,
 * a small window around the current slide, optional ellipsis, last slide.
 */
function visibleDots(current: number, total: number): DotItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      kind: "dot" as const,
      idx: i,
    }));
  }

  const items: DotItem[] = [];
  const winRadius = 1;
  const start = Math.max(1, current - winRadius);
  const end = Math.min(total - 2, current + winRadius);

  items.push({ kind: "dot", idx: 0 });
  if (start > 1) items.push({ kind: "ellipsis", side: "left" });
  for (let i = start; i <= end; i++) items.push({ kind: "dot", idx: i });
  if (end < total - 2) items.push({ kind: "ellipsis", side: "right" });
  items.push({ kind: "dot", idx: total - 1 });

  return items;
}

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
            ? "flex flex-1 flex-col items-center overflow-y-auto p-4 sm:p-8"
            : ""
        }
      >
        {/*
          In fullscreen we use auto vertical margins on the card instead of
          `items-center` on the parent. Reason: classic flexbox centering
          pushes content above the scroll origin when the card is taller
          than the viewport, hiding the top of long slides. `my-auto`
          collapses to 0 when there's no spare room, so long slides scroll
          cleanly from the top while short slides still feel centered.
        */}
        <div
          className={
            "rounded-2xl border border-black/5 bg-white shadow-card " +
            (isFullscreen
              ? // No `overflow-hidden` here in fullscreen: it would create
                // a clipping scroll context that prevents the outer
                // overflow-y-auto wrapper from scrolling on mobile
                // Chrome's fullscreen surface. The outer element is sized
                // to the viewport, so a horizontal page scroll isn't
                // reachable anyway.
                "my-auto w-full max-w-5xl p-6 sm:p-12"
              : // Non-fullscreen: clip horizontal overflow as a safety net
                // so a wide markdown table can never push the page wider
                // than its column. The table's own scroll wrapper still
                // scrolls cleanly within the card.
                "overflow-hidden p-6 sm:p-8")
          }
        >
          <div className={isFullscreen ? undefined : "min-h-[320px]"}>
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
          aria-label="Previous slide"
          className="focus-ring inline-flex items-center justify-center gap-1 rounded-md border border-black/10 bg-white p-2 text-sm font-medium hover:bg-black/5 disabled:opacity-40 sm:px-4 sm:py-2"
        >
          <ChevronLeft size={18} aria-hidden className="sm:hidden" />
          <span className="hidden sm:inline">← Previous</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1.5"
            aria-label="Slide progress"
          >
            {visibleDots(idx, total).map((item) =>
              item.kind === "ellipsis" ? (
                <span
                  key={`ellipsis-${item.side}`}
                  aria-hidden
                  className="px-0.5 text-xs leading-none text-buckeye-gray"
                >
                  …
                </span>
              ) : (
                <button
                  key={item.idx}
                  type="button"
                  onClick={() => setIdx(item.idx)}
                  aria-label={`Go to slide ${item.idx + 1}`}
                  aria-current={item.idx === idx ? "step" : undefined}
                  className={
                    "h-2.5 rounded-full transition-all " +
                    (item.idx === idx
                      ? "w-6 bg-buckeye-scarlet"
                      : "w-2.5 bg-black/15 hover:bg-black/30")
                  }
                />
              ),
            )}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white p-2 text-sm font-medium hover:bg-black/5 sm:px-3 sm:py-2"
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
          aria-label="Next slide"
          className="focus-ring inline-flex items-center justify-center gap-1 rounded-md border border-black/10 bg-white p-2 text-sm font-medium hover:bg-black/5 disabled:opacity-40 sm:px-4 sm:py-2"
        >
          <ChevronRight size={18} aria-hidden className="sm:hidden" />
          <span className="hidden sm:inline">Next →</span>
        </button>
      </div>

      {!isFullscreen ? (
        <div className="no-print mt-2 text-center text-xs text-buckeye-gray">
          Slide {idx + 1} of {total}
          <span className="hidden sm:inline">
            {" "}
            · arrow keys to navigate, F for fullscreen
          </span>
        </div>
      ) : null}
    </div>
  );
}
