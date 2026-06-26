import { weapons } from "@/data/weapons";
import { greatshields } from "@/data/greatshields";
import { shields } from "@/data/shields";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  WEAPON / SHIELD ICON RESOLUTION
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Weapon art lives in public/icons/weapons/<type>/<name>.png, where <type> is
 *  the weapon's type from src/data/weapons.ts (kebab-case + pluralised, e.g.
 *  "Curved Greatsword" → curved-greatswords/) and <name> is the kebab-case name
 *  with apostrophes dropped (e.g. "Onyx Lord's Greatsword" → onyx-lords-greatsword).
 *
 *  Shields aren't in weapons.ts, so they resolve from their own data instead:
 *    • greatshields → /icons/greatshields/<id>.png   (src/data/greatshields.ts)
 *    • small/medium → /icons/<class>-shields/<id>.png (src/data/shields.ts)
 *
 *  `iconFor` resolves all of the above automatically from a name, so dropping a
 *  correctly-named file in the right folder is all that's needed — no per-item
 *  wiring. Missing files degrade to the placeholder (WeaponIcon's onError).
 *
 *  The `weaponIcons` map below is only for one-off overrides (a non-standard
 *  filename/location for a single name). A WeaponEntry in sets.ts may also set
 *  its own `icon`, which wins over everything.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const weaponIcons: Record<string, string> = {
  // (none currently — add a "Name": "/path.png" line here only to override.)
};

// Strip accents (é → e) so "Great Épée" and "Great Epee" resolve the same.
const deburr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const norm = (s: string) => deburr(s.toLowerCase()).replace(/['’.]/g, "").replace(/\s+/g, " ").trim();
const slug = (s: string) =>
  deburr(s.toLowerCase()).replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const typeFolder = (t: string) => {
  const k = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (/(ch|sh|s|x|z)$/.test(k)) return k + "es";
  return k.endsWith("s") ? k : k + "s";
};

/** weapon name (normalised) → type, for deriving the folder from a set entry. */
const nameToType: Record<string, string> = {};
for (const w of weapons) nameToType[norm(w.name)] = w.type;

/** shield name → icon path (greatshields + small/medium). */
const shieldIcons: Record<string, string> = {};
for (const g of greatshields) shieldIcons[g.name] = g.icon ?? `/icons/greatshields/${g.id}.png`;
for (const s of shields) shieldIcons[s.name] = `/icons/${s.class}-shields/${s.id}.png`;

/**
 * Resolve the icon path for a weapon/shield/entry:
 *   1. its own `icon` override, else
 *   2. a `weaponIcons` override, else
 *   3. a shield path (greatshields / small / medium), else
 *   4. a derived /icons/weapons/<type>/<name>.png path.
 * Returns undefined when nothing matches (→ placeholder). A path to a missing
 * file also degrades to the placeholder via WeaponIcon's onError.
 */
export function iconFor(entry?: { name: string; icon?: string; type?: string }): string | undefined {
  if (!entry) return undefined;
  if (entry.icon) return entry.icon;
  if (weaponIcons[entry.name]) return weaponIcons[entry.name];
  if (shieldIcons[entry.name]) return shieldIcons[entry.name];
  const type = entry.type ?? nameToType[norm(entry.name)];
  if (!type) return undefined;
  return `/icons/weapons/${typeFolder(type)}/${slug(entry.name)}.png`;
}
