import type { WeaponEntry } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  WEAPON ICON REGISTRY  ·  add weapon art here
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  The town-map sets reuse the same weapons heavily — 378 entries across the
 *  21 sets, but only ~207 distinct weapons (e.g. "Golem Greatbow" shows up in
 *  12 sets). A weapon's icon depends only on its NAME, so map each weapon ONCE
 *  here and it renders everywhere that weapon appears.
 *
 *  ── HOW TO SLOT IN AN ICON ────────────────────────────────────────────────
 *  1. Drop the image in the weapon-TYPE subfolder under public/icons/weapons/,
 *     e.g. a whip goes in  public/icons/weapons/whips/  and a straight sword in
 *     public/icons/weapons/straight-swords/  (the type is in src/data/weapons.ts,
 *     folder = kebab-case + pluralised, e.g. "Curved Greatsword" →
 *     curved-greatswords). Rarity backdrops live in  public/icons/weapons/backgrounds/.
 *  2. Add a line below, keyed by the weapon's EXACT name as written in
 *     src/data/sets.ts — copy/paste it; the key is case- and punctuation-
 *     sensitive (apostrophes, "'s", etc. must match):
 *
 *         "Rivers of Blood": "/icons/weapons/katanas/rivers-of-blood.png",
 *
 *  ── CONVENTIONS ───────────────────────────────────────────────────────────
 *  • Path  — relative to /public: "/icons/weapons/<type-plural>/<file>.png".
 *  • File  — kebab-case of the name, e.g. "Golem Greatbow" →
 *            "golem-greatbow.png", "Crepus's Black Crossbow" →
 *            "crepuss-black-crossbow.png" (drop apostrophes). This is just a
 *            recommendation — the value here is the source of truth, so any
 *            path works as long as it matches the file you dropped.
 *  • Art   — square PNG or WEBP, ~128×128, transparent background preferred.
 *
 *  A weapon with no entry here falls back to the framed blade-glyph
 *  placeholder, so the registry can be filled in gradually — nothing breaks
 *  while it's incomplete.
 *
 *  Per-entry override: a WeaponEntry in sets.ts may set its own `icon`; that
 *  always wins over this registry for that single row (rarely needed).
 * ─────────────────────────────────────────────────────────────────────────
 */
export const weaponIcons: Record<string, string> = {
  // ── Signature weapons (the icon shown on each town-map grid card) ─────────
  "Siluria's Tree": "/icons/weapons/great-spears/silurias-tree.png", // set 0, 1
  "Magma Blade": "/icons/weapons/curved-swords/magma-blade.png", // set 2
  "Scepter of the All-Knowing": "/icons/weapons/hammers/scepter-of-the-all-knowing.png", // set 3
  "Sword of St. Trina": "/icons/weapons/straight-swords/sword-of-st-trina.png", // set 4
  "Ornamental Straight Sword": "/icons/weapons/straight-swords/ornamental-straight-sword.png", // set 5
  "Bloody Helice": "/icons/weapons/heavy-thrusting-swords/bloody-helice.png", // set 6
  "Icerind Hatchet": "/icons/weapons/axes/icerind-hatchet.png", // set 7
  "Winged Scythe": "/icons/weapons/reapers/winged-scythe.png", // set 8
  "Halo Scythe": "/icons/weapons/reapers/halo-scythe.png", // set 9
  "Royal Greatsword": "/icons/weapons/colossal-swords/royal-greatsword.png", // set 10
  "Cleanrot Spear": "/icons/weapons/spears/cleanrot-spear.png", // set 11
  "Envoy's Horn": "/icons/weapons/hammers/envoys-horn.png", // set 12
  "Gargoyle's Black Blades": "/icons/weapons/twinblades/gargoyles-black-blades.png", // set 13
  "Frozen Needle": "/icons/weapons/thrusting-swords/frozen-needle.png", // set 14
  "Clinging Bone": "/icons/weapons/fists/clinging-bone.png", // set 15
  "Coded Sword": "/icons/weapons/straight-swords/coded-sword.png", // set 16
  "Vyke's War Spear": "/icons/weapons/great-spears/vykes-war-spear.png", // set 17
  "Onyx Lord's Greatsword": "/icons/weapons/curved-greatswords/onyx-lords-greatsword.png", // set 18
  "Magma Whip Candlestick": "/icons/weapons/whips/magma-whip-candlestick.png", // set 19
  "Cipher Pata": "/icons/weapons/fists/cipher-pata.png", // set 20
};

/**
 * Resolve the icon for a weapon entry: its own `icon` if set, otherwise the
 * shared registry (keyed by name). Returns undefined → show the placeholder.
 */
export function iconFor(entry?: Pick<WeaponEntry, "name" | "icon">): string | undefined {
  if (!entry) return undefined;
  return entry.icon ?? weaponIcons[entry.name];
}
