"use client";

import { useState } from "react";
import { GLOSSARY } from "@/lib/chess/glossary";

export type TermProps = {
  /** Glossary key to look up, e.g. "fork", "pin". */
  name: string;
  /** Override the displayed word (defaults to children or name). */
  children?: React.ReactNode;
};

export function Term({ name, children }: TermProps) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[name.toLowerCase()];

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="focus-ring cursor-help rounded-sm border-b border-dotted border-buckeye-scarlet/60 font-medium text-buckeye-ink hover:bg-buckeye-cream/60"
        aria-expanded={open}
      >
        {children ?? name}
      </button>
      {open && entry ? (
        <span
          role="tooltip"
          className="absolute left-1/2 z-20 mt-1 w-64 -translate-x-1/2 rounded-md border border-black/10 bg-white p-3 text-sm text-buckeye-ink shadow-lg"
        >
          <span className="block font-semibold text-buckeye-scarlet">
            {entry.title}
          </span>
          <span className="mt-1 block">{entry.description}</span>
        </span>
      ) : null}
    </span>
  );
}
