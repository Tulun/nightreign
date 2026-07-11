"use client";

import { useMemo, useState } from "react";
import { deepRelics } from "@/data/deepRelics";
import {
  characterIndex,
  DEEP_RELIC_CATEGORIES,
  groupByCharacter,
  RELIC_CREDIT,
  splitCharacter,
  type DeepRelic,
  type DeepRelicCategory,
} from "@/lib/relics";
import { STACK_META } from "@/lib/weaponPassives";

export function DeepRelicEffects() {
  const [cat, setCat] = useState<DeepRelicCategory | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      deepRelics.filter((r) => {
        if (cat !== "all" && r.category !== cat) return false;
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.effect.toLowerCase().includes(q) ||
          (r.note?.toLowerCase().includes(q) ?? false)
        );
      }),
    [cat, q],
  );

  const groups = DEEP_RELIC_CATEGORIES.map((c) => {
    let items = filtered.filter((r) => r.category === c.key);
    if (c.key === "character") {
      items = [...items].sort(
        (a, b) =>
          characterIndex(a.name) - characterIndex(b.name) ||
          splitCharacter(a.name).rest.localeCompare(splitCharacter(b.name).rest, undefined, { numeric: true }),
      );
    } else {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }
    return { ...c, items };
  }).filter((g) => g.items.length > 0);

  return (
    <div>
      <p className="mb-4 rounded-lg border border-night-600 bg-night-800/60 px-4 py-2.5 font-body text-sm text-parchment-muted">
        Deep relics roll from a richer pool with stronger tiers, plus{" "}
        <span className="font-semibold text-sky-300">Character</span> stat-swaps and{" "}
        <span className="font-semibold text-red-300">Curse</span> drawbacks.
      </p>

      <div className="mb-5 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deep relic effects…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")} label="All" />
          {DEEP_RELIC_CATEGORIES.map((c) => (
            <FilterChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.label} />
          ))}
        </div>
      </div>

      {/* Stack legend */}
      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5 font-body text-xs text-parchment-faint">
        {(["yes", "tiers", "no"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`rounded border px-1.5 py-0.5 text-[0.65rem] ${STACK_META[k].cls}`}>{STACK_META[k].label}</span>
            {STACK_META[k].legend}
          </span>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No deep relic effects match “{query}”.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.key}>
              <h3 className="eyebrow mb-2">
                {g.label} <span className="text-parchment-faint">· {g.items.length}</span>
              </h3>
              {g.key === "character" ? (
                <div className="space-y-4">
                  {groupByCharacter(g.items).map((cg) => (
                    <div key={cg.character}>
                      <h4 className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-sky-300/80">
                        {cg.character}
                      </h4>
                      <div className="space-y-1.5">
                        {cg.items.map(({ item, rest }) => (
                          <RelicRow key={item.name} relic={item} display={rest} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {g.items.map((r) => (
                    <RelicRow key={r.name} relic={r} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{RELIC_CREDIT}.</p>
    </div>
  );
}

function RelicRow({ relic, display }: { relic: DeepRelic; display?: string }) {
  const stack = STACK_META[relic.stack];
  return (
    <div className="frame rounded-lg bg-night-800 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-sm font-semibold text-parchment">{display ?? relic.name}</h4>
        <span className="flex shrink-0 items-center gap-1">
          {relic.crossover && (
            <span
              className="rounded border border-gold-faint/50 px-1.5 py-0.5 font-body text-[0.6rem] font-semibold text-gold-dim"
              title="Also rolls on normal relics"
            >
              Normal + Deep
            </span>
          )}
          <span
            className={`rounded border px-1.5 py-0.5 font-body text-[0.65rem] font-semibold ${stack.cls}`}
            title={stack.legend}
          >
            {stack.label}
          </span>
        </span>
      </div>
      <p className="mt-1 font-body text-sm text-parchment-muted">{relic.effect}</p>
      {relic.note && <p className="mt-1 font-body text-xs italic text-parchment-faint">{relic.note}</p>}
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
