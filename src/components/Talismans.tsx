"use client";

import { useMemo, useState } from "react";
import { talismans } from "@/data/talismans";
import { TALISMAN_CATEGORIES, TALISMAN_CREDIT, talismanCategory, type TalismanCategory } from "@/lib/talismans";

export function Talismans() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<TalismanCategory | "all">("all");

  const withCat = useMemo(() => talismans.map((t) => ({ ...t, category: talismanCategory(t) })), []);
  const q = query.trim().toLowerCase();

  const groups = TALISMAN_CATEGORIES.map((c) => ({
    key: c,
    items: withCat
      .filter((t) => t.category === c)
      .filter((t) => cat === "all" || t.category === cat)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.effect.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search talismans by name or effect…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={cat === "all"} onClick={() => setCat("all")} label="All" />
          {TALISMAN_CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
          ))}
        </div>
      </div>

      <p className="mb-2 font-body text-xs text-parchment-faint">{total} of {talismans.length} talismans</p>

      {groups.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No talismans match “{query}”.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h3 className="eyebrow mb-2">{g.key} <span className="text-parchment-faint">· {g.items.length}</span></h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {g.items.map((t) => (
                  <div key={t.name} className="frame rounded-lg bg-night-800 px-3 py-2.5">
                    <h4 className="font-display text-sm font-semibold text-parchment">{t.name}</h4>
                    <p className="mt-1 font-body text-sm text-parchment-muted">{t.effect}</p>
                    {t.detail && <p className="mt-1 font-body text-xs text-parchment-faint">{t.detail}</p>}
                    {t.note && <p className="mt-1 font-body text-xs italic text-amber-300/80">{t.note}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{TALISMAN_CREDIT}.</p>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition-colors ${
        active ? "border-gold-faint bg-night-700 text-gold-bright" : "border-night-600 bg-night-800 text-parchment-muted hover:bg-night-700"
      }`}
    >
      {label}
    </button>
  );
}
