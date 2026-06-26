// ─────────────────────────────────────────────────────────────────────────
//  Resolve a town-map item's passive + tier into its concrete boost, e.g.
//  ("Improved skill attack power", "blue") → "+18%".
//
//  Values come from the weapon-passive sheet (src/data/weaponPassives.ts), whose
//  `effect` text carries the per-tier list (e.g. "1.15x / 1.18x / 1.21x"). The
//  shop tier maps to the list index: common = 0, blue = 1, purple = 2.
//
//  Only multiplier (Nx) and percent (N%) lists yield a badge — flat lists
//  (stat/discovery) and per-element lists return null ("where applicable").
// ─────────────────────────────────────────────────────────────────────────
import { weaponPassives } from "@/data/weaponPassives";
import type { Tier } from "@/lib/tiers";

const TIER_INDEX: Record<Tier, number> = { common: 0, blue: 1, purple: 2 };

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// name → effect text, expanding single slash-groups (e.g. an element/variant
// list "Magic/Fire/Lightning/Holy") into one key per option, so the shop's
// element-specific names ("Improved holy damage negation") still resolve.
const effectByName: Record<string, string> = {};
for (const p of weaponPassives) {
  effectByName[normalize(p.name)] = p.effect;
  const words = p.name.split(" ");
  const gi = words.findIndex((w) => w.includes("/"));
  if (gi !== -1) {
    for (const opt of words[gi].split("/")) {
      const key = normalize([...words.slice(0, gi), opt, ...words.slice(gi + 1)].join(" "));
      if (!(key in effectByName)) effectByName[key] = p.effect;
    }
  }
}

function formatToken(token: string): string | null {
  const mult = token.match(/^([\d.]+)x$/);
  if (mult) {
    const pct = Math.round((parseFloat(mult[1]) - 1) * 1000) / 10;
    return pct === 0 ? null : `${pct > 0 ? "+" : ""}${pct}%`;
  }
  const pct = token.match(/^([\d.]+)%$/);
  if (pct) return `+${pct[1]}%`;
  return null;
}

/** The boost string for a passive at a given tier, or null if not applicable. */
export function passiveBoost(passive: string, tier: Tier): string | null {
  const effect = effectByName[normalize(passive)];
  if (!effect) return null;
  // First run of " / "-separated numeric tokens (the per-tier list).
  const run = effect.match(/[\d.]+x?%?(?:\s*\/\s*[\d.]+x?%?)+/);
  if (!run) return null;
  const tokens = run[0].split("/").map((t) => t.trim());
  const idx = TIER_INDEX[tier];
  return idx < tokens.length ? formatToken(tokens[idx]) : null;
}
