"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sets } from "@/data/sets";
import {
  buildFilterOptions,
  filterSets,
  searchSets,
  type FilterOption,
  type WeaponSource,
} from "@/lib/filters";
import { SetCard } from "./SetCard";

const FILTERS_KEY = "nr:townmap:filters";
const SEARCH_KEY = "nr:townmap:search";

type OpenMenu = "weapons" | "passives" | null;

/**
 * The Town Map grid with a search field plus two multiselect filter dropdowns —
 * one for staves/seals, one for passives. The dropdowns combine with ANY (OR)
 * semantics; the search then narrows that result by item name/passive. Both the
 * selection and the query persist to localStorage across navigation/reloads.
 */
export function FilteredSetGrid() {
  const { weapons, passives } = useMemo(() => buildFilterOptions(), []);
  const allOptions = useMemo(() => [...weapons, ...passives], [weapons, passives]);

  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  // Restore the saved selection + query on mount (effect, to avoid mismatch).
  useEffect(() => {
    const validKeys = new Set(allOptions.map((o) => o.key));
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setSelected(parsed.filter((k) => typeof k === "string" && validKeys.has(k)));
      }
    } catch {
      // ignore malformed/blocked storage
    }
    try {
      const q = localStorage.getItem(SEARCH_KEY);
      if (typeof q === "string") setQuery(q);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [allOptions]);

  // Persist on change — only after hydration, so initial empty state doesn't
  // clobber previously saved values.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(selected));
    } catch {
      // ignore
    }
  }, [selected, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SEARCH_KEY, query);
    } catch {
      // ignore
    }
  }, [query, hydrated]);

  const visible = useMemo(
    () => searchSets(filterSets(sets, selected, allOptions), query),
    [selected, allOptions, query],
  );
  const selectedOptions = useMemo(
    () => allOptions.filter((o) => selected.includes(o.key)),
    [allOptions, selected],
  );

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const countIn = (opts: FilterOption[]) =>
    opts.reduce((n, o) => (selected.includes(o.key) ? n + 1 : n), 0);

  const searching = query.trim().length > 0;
  const active = searching || selected.length > 0;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3 max-w-md">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-parchment-faint"
        >
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search weapons or passives…"
          aria-label="Search items and passives"
          autoComplete="off"
          className="frame w-full rounded-md bg-night-800 py-2.5 pl-10 pr-10 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none focus:ring-1 focus:ring-gold"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-parchment-faint transition-colors hover:text-gold"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterMenu
          title="Staves & Seals"
          options={weapons}
          selected={selected}
          onToggle={toggle}
          badge={countIn(weapons)}
          open={openMenu === "weapons"}
          onOpen={() => setOpenMenu("weapons")}
          onClose={() => setOpenMenu((m) => (m === "weapons" ? null : m))}
        />
        <FilterMenu
          title="Passives"
          options={passives}
          selected={selected}
          onToggle={toggle}
          badge={countIn(passives)}
          open={openMenu === "passives"}
          onOpen={() => setOpenMenu("passives")}
          onClose={() => setOpenMenu((m) => (m === "passives" ? null : m))}
        />

        <button
          type="button"
          onClick={() => setSelected([])}
          disabled={selected.length === 0}
          className="frame inline-flex items-center gap-1.5 rounded-md bg-night-800 px-3 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-night-800 disabled:hover:text-parchment-muted"
        >
          <CloseIcon />
          Deselect all
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
      </div>

      {/* Result count */}
      <p className="mb-3 font-body text-xs uppercase tracking-[0.08em] text-parchment-faint">
        {visible.length} {visible.length === 1 ? "set" : "sets"}
        {active ? " matched" : ""}
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
          No sets match the current search and filters.
        </p>
      )}
    </div>
  );
}

interface FilterMenuProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string) => void;
  badge: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function FilterMenu({ title, options, selected, onToggle, badge, open, onOpen, onClose }: FilterMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="frame inline-flex items-center gap-2 rounded-md bg-night-800 px-3 py-2 font-body text-sm text-parchment transition-colors hover:bg-night-700"
      >
        <FilterIcon />
        {title}
        {badge > 0 && (
          <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold px-1.5 text-xs font-semibold text-night-950">
            {badge}
          </span>
        )}
        <Chevron open={open} />
      </button>

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
                {o.dividerBefore && i > 0 && <div className="my-1.5 border-t border-night-600" />}
                <label className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(o.key)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className={checked ? "text-parchment" : undefined}>{o.label}</span>
                  {o.source && <SourceBadge source={o.source} />}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SOURCE_BADGE: Record<WeaponSource, { label: string; className: string }> = {
  special: { label: "Special", className: "border-gold-faint text-gold" },
  normal: { label: "Normal", className: "border-night-600 text-parchment-faint" },
  both: { label: "Both", className: "border-gold-faint text-parchment" },
};

function SourceBadge({ source }: { source: WeaponSource }) {
  const { label, className } = SOURCE_BADGE[source];
  return (
    <span
      className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 5.5h17l-6.5 7.5v5l-4 2v-7L3.5 5.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
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
