"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm";

export function OneOffEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [signupUrl, setSignupUrl] = useState("");
  const [featured, setFeatured] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/host/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          kind: "tournament",
          featured,
          signupUrl: signupUrl.trim() || null,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not create event.");
      router.push("/host/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClassName}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Description</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClassName}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClassName}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Starts</span>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Ends</span>
          <input
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Signup URL</span>
        <input
          type="url"
          value={signupUrl}
          onChange={(e) => setSignupUrl(e.target.value)}
          placeholder="https://..."
          className={inputClassName}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        Featured on home page
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="focus-ring rounded-md bg-buckeye-scarlet px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Create event"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
