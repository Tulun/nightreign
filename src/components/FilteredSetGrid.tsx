"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sets } from "@/data/sets";
import {
  buildFilterOptions,
  filterSets,
  type FilterOption,
  type WeaponSource,
} from "@/lib/filters";
import { SetCard } from "./SetCard";

const STORAGE_KEY = "nr:townmap:filters";

type OpenMenu = "weapons" | "passives" | null;

/**
 * The Town Map grid with two multiselect filter dropdowns on top — one for
 * specific staves/seals, one for passives — kept separate so the long passive
 * list doesn't crowd out the weapon picks. Sets matching ANY selected filter
 * are shown. The selection persists to localStorage across navigation/reloads.
 */
export function FilteredSetGrid() {
  const { weapons, passives } = useMemo(() => buildFilterOptions(), []);
  const allOptions = useMemo(() => [...weapons, ...passives], [weapons, passives]);

  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  // Restore the saved selection on mount (effect, to avoid hydration mismatch).
  useEffect(() => {
    const validKeys = new Set(allOptions.map((o) => o.key));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setSelected(parsed.filter((k) => typeof k === "string" && validKeys.has(k)));
      }
    } catch {
      // ignore malformed/blocked storage
    }
    setHydrated(true);
  }, [allOptions]);

  // Persist on change — only after hydration, so the initial empty state
  // doesn't clobber a previously saved selection.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [selected, hydrated]);

  const visible = useMemo(
    () => filterSets(sets, selected, allOptions),
    [selected, allOptions],
  );
  const selectedOptions = useMemo(
    () => allOptions.filter((o) => selected.includes(o.key)),
    [allOptions, selected],
  );

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const countIn = (opts: FilterOption[]) =>
    opts.reduce((n, o) => (selected.includes(o.key) ? n + 1 : n), 0);

  return (
    <div>
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
