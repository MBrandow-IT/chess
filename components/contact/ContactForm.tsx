"use client";

import { useState } from "react";
import {
  CONTACT_CATEGORIES,
  CONTACT_CATEGORY_LABELS,
  type ContactCategory,
} from "@/lib/contact/validation";

const inputClassName =
  "focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm";

export function ContactForm() {
  const [category, setCategory] = useState<ContactCategory>("advice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          email,
          message,
          pageUrl: pageUrl.trim() || undefined,
          company,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(data?.error ?? "Could not send your message.");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">Thanks — your message was received.</p>
        <p className="mt-1">
          If a reply is needed, we will follow up at the email address you
          provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Topic</span>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as ContactCategory)}
          className={inputClassName}
        >
          {CONTACT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CONTACT_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Name</span>
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          maxLength={80}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Message</span>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClassName}
          maxLength={2000}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Page URL{" "}
          <span className="font-normal text-buckeye-gray">(optional)</span>
        </span>
        <input
          type="url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          className={inputClassName}
          placeholder="https://buckeyechess.org/plans/..."
        />
        {category === "bug_report" ? (
          <span className="mt-1 block text-xs text-buckeye-gray">
            Paste the page where you saw the bug, if you can.
          </span>
        ) : null}
      </label>

      <div
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label>
          Company
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring rounded-md bg-buckeye-scarlet px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send message"}
      </button>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
