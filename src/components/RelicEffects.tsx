"use client";

import { useMemo, useState } from "react";
import { relicEffects } from "@/data/relicEffects";
import {
  characterIndex,
  groupByCharacter,
  RELIC_CATEGORIES,
  RELIC_CREDIT,
  RELIC_GROUPS,
  RELIC_VALUES,
  type RelicEffect,
  type RelicGroup,
} from "@/lib/relics";

export function RelicEffects() {
  const [group, setGroup] = useState<RelicGroup | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    return RELIC_CATEGORIES.filter((c) => group === "all" || c.group === group)
      .map((c) => {
        let items = relicEffects.filter(
          (e) => e.category === c.key && (!q || e.name.toLowerCase().includes(q)),
        );
        if (c.key === "character") {
          items = [...items].sort((a, b) => characterIndex(a.name) - characterIndex(b.name));
        }
        return { ...c, items };
      })
      .filter((c) => c.items.length > 0);
  }, [group, q]);

  return (
    <div>
      {/* Rule banner */}
      <div className="mb-5 rounded-lg border border-gold-faint/40 bg-night-800/60 px-4 py-3">
        <p className="font-body text-sm text-parchment">
          A relic can hold several effects, but{" "}
          <span className="font-semibold text-gold-bright">never two from the same category</span> — except
          effects marked{" "}
          <span className="rounded border border-emerald-500/50 px-1 py-0.5 text-[0.65rem] font-semibold text-emerald-300">
            Stacks
          </span>
          , which can roll alongside any others (including each other). Unrollable effects only come on fixed relics.
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
              {c.key === "skill-swap" || c.key === "spell-swap" || c.key === "starting-items" ? (
                <div>
                  <p className="mb-2.5 font-body text-sm text-parchment-muted">
                    {c.key === "skill-swap" ? (
                      <>
                        Changes compatible armament&rsquo;s skill to{" "}
                        <span className="font-semibold text-gold-dim">[Weapon Art]</span> at start of expedition:
                      </>
                    ) : c.key === "spell-swap" ? (
                      <>
                        Changes compatible armament&rsquo;s sorcery / incantation to{" "}
                        <span className="font-semibold text-gold-dim">[Spell]</span> at start of expedition:
                      </>
                    ) : (
                      <>
                        Start the expedition holding{" "}
                        <span className="font-semibold text-gold-dim">[Item]</span>:
                      </>
                    )}
                  </p>
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
                </div>
              ) : c.key === "character" ? (
                <div className="space-y-4">
                  {groupByCharacter(c.items).map((cg) => (
                    <div key={cg.character}>
                      <h4 className="mb-1 font-display text-xs font-semibold uppercase tracking-wider text-gold-dim">
                        {cg.character}
                      </h4>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-0.5 md:grid-cols-2">
                        {cg.items.map(({ item, rest }) => (
                          <div key={item.name} className="border-b border-night-800/70 py-1">
                            <span className="font-body text-sm text-parchment-muted">{rest}</span>
                            {RELIC_VALUES[item.name] && (
                              <p className="mt-0.5 font-body text-[0.7rem] text-gold-dim">{RELIC_VALUES[item.name]}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <GroupedRows items={c.items} />
              )}
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">{RELIC_CREDIT}.</p>
    </div>
  );
}

/** Renders effects as a 2-column list, collapsing tier variants and showing values/notes. */
function GroupedRows({ items }: { items: RelicEffect[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-0.5 md:grid-cols-2">
      {groupTiers(items).map((g) => (
        <div key={g.base} className="border-b border-night-800/70 py-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-body text-sm text-parchment-muted">{g.base}</span>
            <span className="flex shrink-0 items-center gap-1">
              {g.stackable && (
                <span
                  className="rounded border border-emerald-500/50 px-1.5 py-0.5 font-body text-[0.6rem] font-semibold text-emerald-300"
                  title="Stacks — exempt from the one-per-category rule"
                >
                  Stacks
                </span>
              )}
              {g.tiers.map((t) => (
                <span
                  key={t}
                  className="rounded border border-night-700 bg-night-900/70 px-1.5 py-0.5 font-body text-[0.65rem] text-gold-dim"
                >
                  {t}
                </span>
              ))}
            </span>
          </div>
          {RELIC_VALUES[g.base] && (
            <p className="mt-0.5 font-body text-[0.7rem] text-gold-dim">{RELIC_VALUES[g.base]}</p>
          )}
          {g.note && <p className="mt-0.5 font-body text-[0.7rem] italic text-parchment-faint">{g.note}</p>}
        </div>
      ))}
    </div>
  );
}

/**
 * Collapse tier variants of an effect onto one line: "Physical Attack Up",
 * "+1", "+2" → { base: "Physical Attack Up", tiers: ["+1", "+2"] }. Effects
 * with no shared base each stay on their own line.
 */
function groupTiers(items: RelicEffect[]): { base: string; tiers: string[]; stackable: boolean; note?: string }[] {
  const order: string[] = [];
  const map = new Map<string, { tiers: string[]; hasBase: boolean; stackable: boolean; note?: string }>();
  for (const it of items) {
    const m = it.name.match(/^(.*?)\s*(\+\d+)$/);
    const base = m ? m[1].trim() : it.name;
    const suffix = m ? m[2] : null;
    if (!map.has(base)) {
      map.set(base, { tiers: [], hasBase: false, stackable: false, note: it.note });
      order.push(base);
    }
    const g = map.get(base)!;
    if (suffix) g.tiers.push(suffix);
    else g.hasBase = true;
    if (it.stackable) g.stackable = true;
    if (!g.note && it.note) g.note = it.note;
  }
  return order.map((base) => {
    const g = map.get(base)!;
    // Show an explicit "+0" when a base version coexists with tier variants.
    const tiers = g.tiers.length > 0 && g.hasBase ? ["+0", ...g.tiers] : g.tiers;
    return { base, tiers, stackable: g.stackable, note: g.note };
  });
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
