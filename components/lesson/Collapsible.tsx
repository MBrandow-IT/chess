"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type CollapsibleProps = {
  /** Heading shown in the collapse trigger button. */
  title: string;
  /** Optional short subtitle/explanation rendered under the title. */
  subtitle?: string;
  /** If true, the section is expanded on first render. Defaults to false. */
  defaultOpen?: boolean;
  /** Body content. */
  children: React.ReactNode;
};

export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-black/5 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.025]"
      >
        <span className="flex flex-col">
          <span className="font-display text-lg font-semibold text-buckeye-ink">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-0.5 text-sm text-buckeye-gray">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          size={20}
          className={
            "mt-1 shrink-0 text-buckeye-gray transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open ? (
        <div className="border-t border-black/5 px-5 py-5">{children}</div>
      ) : null}
    </section>
  );
}
