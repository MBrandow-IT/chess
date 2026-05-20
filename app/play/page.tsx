import { PinEntry } from "@/components/play/PinEntry";

export const metadata = { title: "Join a live quiz" };

export default function PlayIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-xl border border-black/5 bg-white p-6 shadow-card">
        <h1 className="font-display text-2xl font-semibold">Join a live quiz</h1>
        <p className="mt-1 text-sm text-buckeye-gray">
          Enter the 6-digit PIN your instructor is showing on the projector.
        </p>
        <div className="mt-6">
          <PinEntry searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}
