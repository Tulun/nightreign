"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sets } from "@/data/sets";
import { buildFilterOptions, filterSets } from "@/lib/filters";
import { SetCard } from "./SetCard";

/**
 * The Town Map grid with a multiselect passive/weapon filter on top.
 * Selecting filters narrows the grid to sets matching ANY selected filter.
 */
export function FilteredSetGrid() {
  const options = useMemo(() => buildFilterOptions(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => filterSets(sets, selected, options),
    [selected, options],
  );
  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.key)),
    [options, selected],
  );

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  // Index of the first non-pinned option — where the divider goes.
  const firstUnpinned = options.findIndex((o) => !o.pinned);

  return (
    <div>
      {/* Filter control */}
      <div ref={rootRef} className="relative mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="frame inline-flex items-center gap-2 rounded-md bg-night-800 px-3 py-2 font-body text-sm text-parchment transition-colors hover:bg-night-700"
          >
            <FilterIcon />
            Filter
            {selected.length > 0 && (
              <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold px-1.5 text-xs font-semibold text-night-950">
                {selected.length}
              </span>
            )}
            <Chevron open={open} />
          </button>

          {selectedOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle(o.key)}
              aria-label={`Remove filter ${o.label}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-faint bg-night-800 py-1 pl-3 pr-2 font-body text-xs uppercase tracking-[0.03em] text-parchment transition-colors hover:border-gold hover:text-gold"
            >
              {o.label}
              <span aria-hidden="true" className="text-base leading-none">×</span>
            </button>
          ))}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="font-body text-xs uppercase tracking-[0.08em] text-parchment-faint underline-offset-2 transition-colors hover:text-gold hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Dropdown panel */}
        {open && (
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute left-0 top-full z-20 mt-2 max-h-[60vh] w-[min(24rem,90vw)] overflow-y-auto rounded-md border border-night-600 bg-night-900 p-1.5 shadow-2xl"
          >
            {options.map((o, i) => {
              const checked = selected.includes(o.key);
              return (
                <div key={o.key}>
                  {i === firstUnpinned && firstUnpinned > 0 && (
                    <div className="my-1.5 border-t border-night-600" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.key)}
                      className="h-4 w-4 accent-gold"
                    />
                    <span className={checked ? "text-parchment" : undefined}>{o.label}</span>
                    {o.kind === "name" && (
                      <span className="ml-auto rounded bg-night-700 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-parchment-faint">
                        weapon
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="mb-3 font-body text-xs uppercase tracking-[0.08em] text-parchment-faint">
        {visible.length} {visible.length === 1 ? "set" : "sets"}
        {selected.length > 0 ? " matched" : ""}
      </p>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No sets match the selected filters.
        </p>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 5.5h17l-6.5 7.5v5l-4 2v-7L3.5 5.5z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
