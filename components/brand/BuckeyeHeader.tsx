"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Routes that get a "focused" chrome-free experience. /play has its own
// branding once you join, and /host already renders its own toolbar with
// the dashboard link + sign-out, so the global header would be redundant.
const HIDDEN_PREFIXES = ["/play", "/host"];

function shouldHideHeader(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BuckeyeHeader() {
  const pathname = usePathname();
  if (shouldHideHeader(pathname)) return null;

  return (
    <header className="no-print sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-16">
        <Link
          href="/"
          aria-label="Buckeye Chess Workshops home"
          className="focus-ring flex items-center gap-2 rounded-md px-1 py-1 text-buckeye-ink sm:gap-3"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-md bg-buckeye-scarlet text-white shadow-card"
          >
            <span className="font-display text-lg font-bold leading-none">
              &#9812;
            </span>
          </span>
          {/* Text label hides on mobile so the header doesn't crowd the nav. */}
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-semibold sm:text-base">
              Buckeye Chess Workshops
            </span>
            <span className="text-xs text-buckeye-gray">
              Buckeye Public Library
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-xs sm:text-sm">
          <Link
            href="/plans"
            className="focus-ring rounded-md px-2 py-1.5 text-buckeye-ink hover:bg-black/5 sm:px-3 sm:py-2"
          >
            {/* Shorter label on mobile to keep the bar from wrapping. */}
            <span className="sm:hidden">Plans</span>
            <span className="hidden sm:inline">Lesson Plans</span>
          </Link>
          <Link
            href="/play"
            className="focus-ring rounded-md bg-buckeye-scarlet px-2 py-1.5 font-medium text-white hover:bg-red-700 sm:px-3 sm:py-2"
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join a Quiz</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
