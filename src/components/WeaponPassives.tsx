"use client";

import { useMemo, useState } from "react";
import { weaponPassives } from "@/data/weaponPassives";
import {
  PASSIVE_CATEGORIES,
  STACK_META,
  WEAPON_PASSIVE_CREDIT,
  type PassiveCategory,
  type WeaponPassive,
} from "@/lib/weaponPassives";

export function WeaponPassives() {
  const [cat, setCat] = useState<PassiveCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return weaponPassives.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.effect.toLowerCase().includes(q) ||
        (p.note?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cat, query]);

  // Group the filtered list by category, in the canonical category order.
  const groups = PASSIVE_CATEGORIES.map((c) => ({
    ...c,
    items: filtered.filter((p) => p.category === c.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search passives by name or effect…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")} label="All" />
          {PASSIVE_CATEGORIES.map((c) => (
            <FilterChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.label} />
          ))}
        </div>
      </div>

      {/* Stack legend */}
      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5 font-body text-xs text-parchment-faint">
        {(["yes", "tiers", "maybe", "no"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`rounded border px-1.5 py-0.5 text-[0.65rem] ${STACK_META[k].cls}`}>{STACK_META[k].label}</span>
            {STACK_META[k].legend}
          </span>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No passives match “{query}”.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.key}>
              <h3 className="eyebrow mb-2">
                {g.label} <span className="text-parchment-faint">· {g.items.length}</span>
              </h3>
              <div className="space-y-1.5">
                {g.items.map((p) => (
                  <PassiveRow key={p.name} passive={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{WEAPON_PASSIVE_CREDIT}.</p>
    </div>
  );
}

function PassiveRow({ passive }: { passive: WeaponPassive }) {
  const stack = STACK_META[passive.stack];
  return (
    <div className="frame rounded-lg bg-night-800 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-sm font-semibold text-parchment">{passive.name}</h4>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-body text-[0.65rem] font-semibold ${stack.cls}`}
          title={stack.legend}
        >
          {stack.label}
        </span>
      </div>
      <p className="mt-1 font-body text-sm text-parchment-muted">{passive.effect}</p>
      {passive.note && <p className="mt-1 font-body text-xs italic text-parchment-faint">{passive.note}</p>}
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
