// ─────────────────────────────────────────────────────────────────────────
//  Resolve a town-map item's passive + tier into its concrete boost, e.g.
//  ("Improved skill attack power", "blue") → "+18%", ("Improved frost
//  resistance", "purple") → "+112", ("Less likely to be targeted", "blue") → "-9".
//
//  Values come from the weapon-passive sheet (src/data/weaponPassives.ts), whose
//  `effect` text carries the per-tier list (e.g. "1.15x / 1.18x / 1.21x"). The
//  shop tier maps to the list index: common = 0, blue = 1, purple = 2.
//
//  Multiplier (Nx) and percent (N%) lists render as percentages; flat lists
//  (resistance, discovery, targeting, regen…) render as a signed number whose
//  sign comes from the effect verb (Increases → +, Decreases/Reduces → −).
//  Proc effects with no per-tier list, and per-element lists, return null.
// ─────────────────────────────────────────────────────────────────────────
import { weaponPassives } from "@/data/weaponPassives";
import type { Tier } from "@/lib/tiers";

const TIER_INDEX: Record<Tier, number> = { common: 0, blue: 1, purple: 2 };

// Normalise for matching: strip accents/punctuation and reconcile the sheet's
// wording variants (charge↔charged, resistance↔resist, death blight↔deathblight).
const deburr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (s: string) =>
  deburr(s.toLowerCase())
    .replace(/['’.]/g, "")
    .replace(/death blight/g, "deathblight")
    .replace(/charged/g, "charge")
    .replace(/resistance/g, "resist")
    .replace(/\s+/g, " ")
    .trim();

// name → effect text. Slash-groups in a name (e.g. "Magic/Fire/Lightning/Holy"
// or the multi-word "Poison/Blood Loss/Sleep/…") are expanded into one key per
// option, so the shop's specific names ("Improved frost resistance") resolve.
const effectByName: Record<string, string> = {};
function addKey(name: string, effect: string) {
  const k = normalize(name);
  if (k && !(k in effectByName)) effectByName[k] = effect;
}
for (const p of weaponPassives) {
  addKey(p.name, p.effect);
  if (p.name.includes("/")) {
    const pieces = p.name.split("/");
    const first = pieces[0].split(" ");
    const option0 = first.pop() as string;
    const prefix = first.join(" ");
    const last = pieces[pieces.length - 1].split(" ");
    const optionLast = last.shift() as string;
    const suffix = last.join(" ");
    const options = [option0, ...pieces.slice(1, -1), optionLast];
    for (const opt of options) addKey([prefix, opt, suffix].filter(Boolean).join(" "), p.effect);
  }
}

/** First run of " / "-separated numeric tokens (the per-tier list). */
const tierList = (effect: string) => effect.match(/[\d.]+x?%?(?:\s*\/\s*[\d.]+x?%?)+/);

function formatPercent(token: string): string | null {
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
  // Per-element lists ("Add Magic/Fire/… to Weapon") aren't per-tier — skip.
  if (/AP to that element/.test(effect)) return null;
  const run = tierList(effect);
  if (!run) return null;
  const tokens = run[0].split("/").map((t) => t.trim());
  const token = tokens[Math.min(TIER_INDEX[tier], tokens.length - 1)];
  const pct = formatPercent(token);
  if (pct) return pct;
  if (/^\d+$/.test(token)) {
    const decrease = /\b(decreases|reduces)\b/i.test(effect);
    return `${decrease ? "-" : "+"}${token}`;
  }
  return null;
}

/** The full effect text for a passive name (or null if unknown). */
export function passiveEffect(passive: string): string | null {
  return effectByName[normalize(passive)] ?? null;
}

/**
 * Effect text with its per-tier list collapsed to the epic/purple value, e.g.
 * "Increases discovery by 20 / 30 / 40" → "Increases discovery by 40". Used as a
 * fallback for proc passives where passiveBoost has no single value to show.
 */
export function passivePurpleEffect(passive: string): string | null {
  const effect = effectByName[normalize(passive)];
  if (!effect) return null;
  return effect.replace(/[\d.]+x?%?(?:\s*\/\s*[\d.]+x?%?)+/, (run) => {
    const tokens = run.split("/").map((t) => t.trim());
    return tokens[Math.min(TIER_INDEX.purple, tokens.length - 1)];
  });
}
