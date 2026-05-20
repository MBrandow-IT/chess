export function BuckeyeFooter() {
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
        <div className="text-xs text-buckeye-gray">
          &copy; {new Date().getFullYear()} Buckeye Chess Workshops
        </div>
      </div>
    </footer>
  );
}
