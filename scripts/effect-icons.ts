// ─────────────────────────────────────────────────────────────────────────
//  Regenerates src/data/effectIcons.ts — the effect-name → icon table behind
//  the glyphs beside each effect line (see src/lib/effectIcon.ts).
//
//  Eldenpedia writes its relic and Nightfarer pages as "[[File:ERN Effect
//  Icon …]] <effect text>", i.e. it already pairs every effect with the icon
//  the game shows. This harvests those pairs, keeps the ones whose effect
//  matches our catalogue, and emits them as a lookup table.
//
//  It also scores guessEffectIcon (the keyword fallback for text the table
//  doesn't carry) against the harvested pairs and prints every disagreement,
//  so the rules can be tuned against real labels rather than by eye.
//
//  Usage:  npm run icons:effects [-- --verbose]
//
//  The icon PNGs themselves are checked in under public/icons/effects/ — see
//  public/icons/README.md. This script only rebuilds the mapping.
// ─────────────────────────────────────────────────────────────────────────

import { writeFileSync } from "node:fs";
import path from "node:path";
import { relicEffects } from "@/data/relicEffects";
import {
  EFFECT_ICONS,
  effectIconKey,
  guessEffectIcon,
  type EffectIcon,
} from "@/lib/effectIcon";

const API = "https://eldenring.wiki.gg/api.php";
const UA = "nightreign-reference/0.1 (fan reference site; effect icon mapping)";

/** Pages that pair effects with icons: the master table, then per-Nightfarer. */
const PAGES = [
  "Nightreign:Effects/Relic Effects",
  "Nightreign:Effects",
  "Nightreign:Relics",
  "Nightreign:Wylder",
  "Nightreign:Guardian",
  "Nightreign:Ironeye",
  "Nightreign:Duchess",
  "Nightreign:Raider",
  "Nightreign:Revenant",
  "Nightreign:Recluse",
  "Nightreign:Executor",
  "Nightreign:Scholar",
  "Nightreign:Undertaker",
];

const verbose = process.argv.includes("--verbose");
const iconSet = new Set<string>(EFFECT_ICONS);

async function wikitext(page: string): Promise<string> {
  const url = `${API}?action=parse&prop=wikitext&format=json&page=${encodeURIComponent(page)}`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${page}: HTTP ${res.status}`);
  const json = (await res.json()) as { parse?: { wikitext?: { "*"?: string } } };
  const text = json.parse?.wikitext?.["*"];
  if (!text) throw new Error(`${page}: no wikitext in response`);
  return text;
}

/** "ERN Effect Icon GSBg Weapon Skill Up.png" → "weapon-skill-up" (or null). */
function slugFor(file: string): EffectIcon | null {
  const m = file.replace(/_/g, " ").match(/^ERN Effect Icon (?:GSBg|NoBg|GDBg|BSBg) (.+)\.png$/);
  if (!m) return null;
  const slug = m[1].trim().toLowerCase().replace(/\s+/g, "-");
  // Named ability/affinity icons (Beast's Hunt, Fire Affinity, …) exist
  // in-game but aren't part of the generic set we ship.
  return iconSet.has(slug) ? (slug as EffectIcon) : null;
}

/** Strip wiki markup from the effect text following an icon. */
function clean(text: string): string {
  return text
    .replace(/<ref[^>]*>.*?<\/ref>|<ref[^>]*\/>/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/'''?/g, "")
    .split("<!--")[0]
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[*|:\s]+|[|\s]+$/g, "");
}

const ICON_LINE = /\[\[File:(ERN[ _]Effect[ _]Icon[^|\]]+?)(?:\|[^\]]*)?\]\]\s*([^|]*)/g;

async function main() {
  // Earlier pages win: the master table is the most carefully maintained.
  const harvested = new Map<string, { icon: EffectIcon; text: string; page: string }>();
  for (const page of PAGES) {
    const text = await wikitext(page);
    let found = 0;
    for (const line of text.split("\n")) {
      for (const [, file, rest] of Array.from(line.matchAll(ICON_LINE))) {
        const icon = slugFor(file.trim());
        const effect = clean(rest);
        if (!icon || effect.length < 4) continue;
        const key = effectIconKey(effect);
        if (!harvested.has(key)) {
          harvested.set(key, { icon, text: effect, page });
          found++;
        }
      }
    }
    console.log(`  ${page} — ${found} new pairs`);
  }
  console.log(`\nharvested ${harvested.size} effect→icon pairs`);

  // ── Keep the pairs our catalogue actually uses ──────────────────────────
  const table = new Map<string, EffectIcon>();
  const unmatched: string[] = [];
  for (const effect of relicEffects) {
    const hit = harvested.get(effectIconKey(effect.name));
    if (hit) table.set(effectIconKey(effect.name), hit.icon);
    else unmatched.push(effect.name);
  }
  console.log(
    `catalogue: ${table.size}/${relicEffects.length} wiki-confirmed, ` +
      `${unmatched.length} left to the keyword rules`,
  );

  // ── Score the rules against every harvested label ───────────────────────
  let agree = 0;
  const disagree: string[] = [];
  for (const { icon, text } of Array.from(harvested.values())) {
    if (guessEffectIcon(text) === icon) agree++;
    else disagree.push(`${guessEffectIcon(text) ?? "(none)"} vs wiki ${icon} — ${text}`);
  }
  const pct = Math.round((100 * agree) / harvested.size);
  console.log(`rules agree with the wiki on ${agree}/${harvested.size} pairs (${pct}%)`);
  if (verbose) {
    console.log("\ndisagreements (rule vs wiki):");
    for (const d of disagree.sort()) console.log(`  ${d}`);
    console.log("\nrule-resolved catalogue entries:");
    for (const name of unmatched) console.log(`  ${guessEffectIcon(name) ?? "(none)"} — ${name}`);
  }
  const unresolved = unmatched.filter((n) => !guessEffectIcon(n));
  if (unresolved.length > 0) {
    console.log(`\n⚠ no icon at all for ${unresolved.length} effects:`);
    for (const n of unresolved) console.log(`  - ${n}`);
  }

  // ── Emit ────────────────────────────────────────────────────────────────
  const rows = Array.from(table.entries()).sort(([a], [b]) => a.localeCompare(b));
  const out = `// GENERATED by scripts/effect-icons.ts — do not edit by hand.
// Effect → icon pairings as published on Eldenpedia (which mirrors the game's
// own relic effect list). ${rows.length} of ${relicEffects.length} catalogue effects; the rest
// fall through to guessEffectIcon in src/lib/effectIcon.ts.
//
// Keys are effectIconKey(name) — lowercased, punctuation-stripped, character
// prefixes flattened. Regenerate with: npm run icons:effects

import type { EffectIcon } from "@/lib/effectIcon";

export const effectIconTable: Record<string, EffectIcon> = {
${rows.map(([k, v]) => `  ${JSON.stringify(k)}: "${v}",`).join("\n")}
};
`;
  const dest = path.join(process.cwd(), "src/data/effectIcons.ts");
  writeFileSync(dest, out);
  console.log(`\nwrote ${rows.length} rows to ${path.relative(process.cwd(), dest)}`);
}

void main();
