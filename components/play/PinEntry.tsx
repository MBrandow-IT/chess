"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export function PinEntry({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const [pin, setPin] = useState(params.pin ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = pin.replace(/\D/g, "");
    if (clean.length === 6) router.push(`/play/${clean}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="sr-only">Game PIN</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          className="focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-3 text-center font-display text-3xl font-bold tracking-[0.5em]"
          aria-label="6-digit game PIN"
        />
      </label>
      <button
        type="submit"
        disabled={pin.replace(/\D/g, "").length !== 6}
        className="focus-ring w-full rounded-md bg-buckeye-scarlet px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  );
}
