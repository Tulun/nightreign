"use client";

import Link from "next/link";
import { useState } from "react";
import { bosses } from "@/data/bosses";
import {
  BOSS_CATEGORIES,
  BOSS_CREDIT,
  DAMAGE_LABEL,
  type BossCategory,
} from "@/lib/bosses";

export function BossCodex() {
  const [cat, setCat] = useState<BossCategory>("night1");
  const list = bosses
    .filter((b) => b.categories.includes(cat))
    .sort((a, b) => a.name.localeCompare(b.name));
  const isNight = cat !== "field";

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {BOSS_CATEGORIES.map((c) => {
          const active = c.key === cat;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              aria-pressed={active}
              className={`frame rounded-lg px-2 py-3 font-display text-sm font-semibold transition-all ${
                active ? "bg-night-700 text-gold-bright shadow-lift" : "bg-night-800 text-parchment-muted hover:bg-night-700"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => {
          const places = isNight ? b.spawnsIn ?? [] : b.locations ?? [];
          return (
            <Link
              key={b.id}
              href={`/bosses/${b.id}`}
              className="frame group flex flex-col rounded-lg bg-night-800 p-3 transition-all hover:bg-night-700"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-parchment group-hover:text-gold-bright">
                  {b.name}
                </h3>
                <svg viewBox="0 0 24 24" className="mt-1 h-3.5 w-3.5 shrink-0 text-parchment-faint transition-colors group-hover:text-gold" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>

              {places.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">
                    {isNight ? "Expedition" : "Found"}
                  </span>
                  {places.map((p) => (
                    <span key={p} className="rounded border border-night-600 px-1.5 py-0.5 font-body text-[0.65rem] text-parchment-muted">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">Weak</span>
                {b.weakTo.length > 0 ? (
                  b.weakTo.map((w) => (
                    <span key={w} className="rounded border border-red-500/50 px-1.5 py-0.5 font-body text-[0.65rem] text-red-300">
                      {DAMAGE_LABEL[w]}
                    </span>
                  ))
                ) : (
                  <span className="font-body text-[0.65rem] text-parchment-faint">—</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">
        Click a boss for full combat info. Negation = % of damage blocked; negative = weakness, higher = stronger
        resist. {BOSS_CREDIT}.
      </p>
    </div>
  );
}
