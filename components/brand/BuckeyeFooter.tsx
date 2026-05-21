"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mirror the hide-list used by BuckeyeHeader so /play and /host stay
// chrome-free top and bottom.
const HIDDEN_PREFIXES = ["/play", "/host"];

function shouldHideFooter(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BuckeyeFooter() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;

  return (
    <footer className="no-print mt-16 border-t border-black/5 bg-white/60">
      <div className="container-page flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-buckeye-gray">
          <p>
            Built by a volunteer in association with the{" "}
            <a
              href="https://www.buckeyelibrary.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-buckeye-scarlet underline-offset-2 hover:underline"
            >
              Buckeye Public Library
            </a>
            .
          </p>
          <p className="mt-1 text-xs">
            For educational and classroom use. Chess pieces are public domain.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs text-buckeye-gray sm:items-end">
          <Link
            href="/contact"
            className="focus-ring rounded-md font-medium text-buckeye-scarlet underline-offset-2 hover:underline"
          >
            Contact
          </Link>
          <p>&copy; {new Date().getFullYear()} Buckeye Chess Workshops</p>
        </div>
      </div>
    </footer>
  );
}
