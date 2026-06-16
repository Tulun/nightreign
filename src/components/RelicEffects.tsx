"use client";

import { useMemo, useState } from "react";
import { relicEffects } from "@/data/relicEffects";
import {
  RELIC_CATEGORIES,
  RELIC_CREDIT,
  RELIC_GROUPS,
  type RelicGroup,
} from "@/lib/relics";

export function RelicEffects() {
  const [group, setGroup] = useState<RelicGroup | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    return RELIC_CATEGORIES.filter((c) => group === "all" || c.group === group)
      .map((c) => ({
        ...c,
        items: relicEffects.filter(
          (e) => e.category === c.key && (!q || e.name.toLowerCase().includes(q)),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [group, q]);

  return (
    <div>
      {/* Rule banner */}
      <div className="mb-5 rounded-lg border border-gold-faint/40 bg-night-800/60 px-4 py-3">
        <p className="font-body text-sm text-parchment">
          A relic can hold several effects, but{" "}
          <span className="font-semibold text-gold-bright">never two from the same category</span>.
          Unique / Stackable relics are the exception; Unrollable effects only come on fixed relics.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-5 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search relic effects…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={group === "all"} onClick={() => setGroup("all")} label="All" />
          {RELIC_GROUPS.map((g) => (
            <FilterChip key={g.key} active={group === g.key} onClick={() => setGroup(g.key)} label={g.label} />
          ))}
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No relic effects match “{query}”.
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map((c) => (
            <section key={c.key} className="frame rounded-lg bg-night-800/50 p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-gold-bright">{c.label}</h3>
                <span className="font-body text-xs text-parchment-faint">{c.items.length}</span>
              </div>
              {c.note && <p className="mb-2.5 font-body text-xs italic text-parchment-faint">{c.note}</p>}
              <div className="flex flex-wrap gap-1.5">
                {c.items.map((e) => (
                  <span
                    key={e.name}
                    className="rounded border border-night-700 bg-night-900/70 px-2 py-1 font-body text-xs text-parchment-muted"
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{RELIC_CREDIT}.</p>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition-colors ${
        active
          ? "border-gold-faint bg-night-700 text-gold-bright"
          : "border-night-600 bg-night-800 text-parchment-muted hover:bg-night-700"
      }`}
    >
      {label}
    </button>
  );
}
