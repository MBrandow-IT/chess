import Link from "next/link";

export function BuckeyeHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="focus-ring flex items-center gap-3 rounded-md px-1 py-1 text-buckeye-ink"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-md bg-buckeye-scarlet text-white shadow-card"
          >
            <span className="font-display text-lg font-bold leading-none">
              &#9812;
            </span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold">
              Buckeye Chess Workshops
            </span>
            <span className="text-xs text-buckeye-gray">
              Buckeye Public Library
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/plans"
            className="focus-ring rounded-md px-3 py-2 text-buckeye-ink hover:bg-black/5"
          >
            Lesson Plans
          </Link>
          <Link
            href="/play"
            className="focus-ring rounded-md bg-buckeye-scarlet px-3 py-2 font-medium text-white hover:bg-red-700"
          >
            Join a Quiz
          </Link>
        </nav>
      </div>
    </header>
  );
}
