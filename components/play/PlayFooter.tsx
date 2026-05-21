import Link from "next/link";

export function PlayFooter() {
  return (
    <footer className="no-print py-6 text-center text-xs text-buckeye-gray">
      Want to host your own quiz?{" "}
      <Link
        href="/contact"
        className="focus-ring rounded-sm text-buckeye-scarlet underline-offset-2 hover:underline"
      >
        Reach out here
      </Link>
      .
    </footer>
  );
}
