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
 *  1. Drop the image in  public/icons/weapons/  (see that folder's README).
 *  2. Add a line below, keyed by the weapon's EXACT name as written in
 *     src/data/sets.ts — copy/paste it; the key is case- and punctuation-
 *     sensitive (apostrophes, "'s", etc. must match):
 *
 *         "Rivers of Blood": "/icons/weapons/rivers-of-blood.webp",
 *
 *  ── CONVENTIONS ───────────────────────────────────────────────────────────
 *  • Path  — relative to /public, must start with "/icons/weapons/".
 *  • File  — kebab-case of the name, e.g. "Golem Greatbow" →
 *            "golem-greatbow.webp", "Crepus's Black Crossbow" →
 *            "crepuss-black-crossbow.webp" (drop apostrophes). This is just a
 *            recommendation — the value here is the source of truth, so any
 *            filename works as long as the path matches the file you dropped.
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
  //  These cover all 21 set cards. Each is COMMENTED OUT: uncomment a line once
  //  you've dropped its file in public/icons/weapons/, so unmapped weapons keep
  //  the placeholder instead of a broken image. Filenames follow the kebab-case
  //  convention (rename the path here if your file differs).
  "Siluria's Tree": "/icons/weapons/silurias-tree.png", // set 0, 1
  "Magma Blade":                "/icons/weapons/magma-blade.png",                // set 2
  // "Scepter of the All-Knowing": "/icons/weapons/scepter-of-the-all-knowing.webp", // set 3
  // "Sword of St. Trina":         "/icons/weapons/sword-of-st-trina.webp",          // set 4
  // "Ornamental Straight Sword":  "/icons/weapons/ornamental-straight-sword.webp",  // set 5
  // "Bloody Helice":              "/icons/weapons/bloody-helice.webp",              // set 6
  // "Icerind Hatchet":            "/icons/weapons/icerind-hatchet.webp",            // set 7
  // "Winged Scythe":              "/icons/weapons/winged-scythe.webp",              // set 8
  // "Halo Scythe":                "/icons/weapons/halo-scythe.webp",                // set 9
  // "Royal Greatsword":           "/icons/weapons/royal-greatsword.webp",           // set 10
  // "Cleanrot Spear":             "/icons/weapons/cleanrot-spear.webp",             // set 11
  // "Envoy's Horn":               "/icons/weapons/envoys-horn.webp",                // set 12
  // "Gargoyle's Black Blades":    "/icons/weapons/gargoyles-black-blades.webp",     // set 13
  // "Frozen Needle":              "/icons/weapons/frozen-needle.webp",              // set 14
  // "Clinging Bone":              "/icons/weapons/clinging-bone.webp",              // set 15
  // "Coded Sword":                "/icons/weapons/coded-sword.webp",                // set 16
  // "Vyke's War Spear":           "/icons/weapons/vykes-war-spear.webp",            // set 17
  // "Onyx Lord's Greatsword":     "/icons/weapons/onyx-lords-greatsword.webp",      // set 18
  // "Magma Whip Candlestick":     "/icons/weapons/magma-whip-candlestick.webp",     // set 19
  // "Cipher Pata":                "/icons/weapons/cipher-pata.webp",                // set 20
};

/**
 * Resolve the icon for a weapon entry: its own `icon` if set, otherwise the
 * shared registry (keyed by name). Returns undefined → show the placeholder.
 */
export function iconFor(entry?: Pick<WeaponEntry, "name" | "icon">): string | undefined {
  if (!entry) return undefined;
  return entry.icon ?? weaponIcons[entry.name];
}
