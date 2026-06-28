"use client";

import { useMemo, useState } from "react";
import { spells } from "@/data/spells";
import {
  SPELL_CATEGORIES,
  SPELL_CREDIT,
  groupBySchool,
  type Spell,
  type SpellCategory,
} from "@/lib/spells";
import { SpellIcon } from "./SpellIcon";

/** Magic spells laid out by school, each spell clickable for its detail card. */
export function MagicSpells() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SpellCategory | "all">("all");
  const [selected, setSelected] = useState<Spell | null>(null);

  const q = query.trim().toLowerCase();
  const schools = useMemo(() => {
    const filtered = spells.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        (s.effect?.toLowerCase().includes(q) ?? false)
      );
    });
    return groupBySchool(filtered);
  }, [q, category]);

  const shown = schools.reduce((n, s) => n + s.spells.length, 0);

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spells by name, school, or effect…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none sm:max-w-sm"
        />
        <div className="flex gap-1.5">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterChip>
          {SPELL_CATEGORIES.map((c) => (
            <FilterChip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
              {c.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mb-4 font-body text-xs text-parchment-faint">
        {shown} of {spells.length} spells
      </p>

      {schools.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No spells match your search.
        </p>
      ) : (
        <div className="space-y-8">
          {schools.map((school) => (
            <section key={school.name}>
              <h3 className="mb-3 flex items-baseline gap-2 border-b border-night-700 pb-1.5 font-display text-lg font-bold text-gold-bright">
                {school.name}
                <span className="font-body text-xs font-normal text-parchment-faint">
                  {school.spells.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {school.spells.map((s) => (
                  <SpellCard key={s.name} spell={s} onClick={() => setSelected(s)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{SPELL_CREDIT}</p>

      {selected && <SpellModal spell={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 font-body text-sm transition-colors ${
        active
          ? "frame border-night-600 bg-night-800 text-gold-bright"
          : "text-parchment-muted hover:bg-night-850 hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}

function SpellCard({ spell, onClick }: { spell: Spell; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="frame flex items-center gap-2.5 rounded-lg bg-night-800 p-2 text-left transition-colors hover:bg-night-750 hover:ring-1 hover:ring-gold-faint"
    >
      <SpellIcon src={spell.icon} alt={spell.name} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold text-parchment">
          {spell.name}
        </span>
        {spell.fp && (
          <span className="font-body text-[0.7rem] text-parchment-faint">{spell.fp} FP</span>
        )}
      </span>
    </button>
  );
}

function SpellModal({ spell, onClose }: { spell: Spell; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={spell.name}
    >
      <div
        className="frame w-full max-w-md rounded-xl bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <SpellIcon src={spell.icon} alt={spell.name} size={72} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{spell.school}</p>
            <h4 className="mt-0.5 font-display text-xl font-bold text-parchment">{spell.name}</h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {spell.fp && <Tag>{spell.fp} FP</Tag>}
              {spell.damage && <Tag>{spell.damage}</Tag>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded text-parchment-faint transition-colors hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {spell.effect && (
          <p className="mt-4 font-body text-sm leading-relaxed text-parchment-muted">{spell.effect}</p>
        )}

        {spell.notes && spell.notes.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-night-700 pt-4">
            {spell.notes.map((note, i) => (
              <li
                key={i}
                className="flex gap-2 font-body text-sm leading-relaxed text-parchment-muted"
              >
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-faint" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-night-600 bg-night-850 px-1.5 py-0.5 font-body text-[0.7rem] text-parchment-muted">
      {children}
    </span>
  );
}
