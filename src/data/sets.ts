import type { MerchantSet } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TOWN MAP SETS  ·  your data lives here
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  One entry per "Set" from the reference sheets (Set 0 … Set 20 → 21 total).
 *
 *  Each WeaponEntry: { name, passive, tier, highlighted?, icon? }
 *    - tier: "common" (grey) | "blue" | "purple"  — matches the row colour.
 *    - highlighted: true if the row text was yellow in the source sheet.
 *    - icon: optional, e.g. "/icons/envoys-horn.png" (drop art in /public/icons).
 *
 *  Passives are stored in sentence case; the UI uppercases them for display,
 *  so you can keep editing them in normal case here.
 *
 *  The grid card for a set uses the LAST item in `normalMerchant` as its
 *  icon + label. Clicking a card shows the Special Merchant items (and the
 *  Normal Merchant items below).
 */
export const sets: MerchantSet[] = [
  {
    id: 0,
    specialMerchant: [
      { name: "Ivory Sickle", passive: "Attacks release mist of charm", tier: "blue" },
      { name: "Nagakiba", passive: "Improved skill attack power", tier: "blue" },
      { name: "Celebrant's Skull", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Guardian's Swordspear", passive: "Improved guarding ability", tier: "blue" },
      { name: "Hand Ballista", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Godslayer's Seal", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Distinguished Greatshield", passive: "Improved lightning damage negation", tier: "blue" },
      { name: "Gargoyle's Blackblade", passive: "Attack up when wielding two armaments", tier: "purple", highlighted: true },
      { name: "Serpent Bow", passive: "Improved critical hits", tier: "purple", highlighted: true },
      { name: "Pulley Crossbow", passive: "Improved attack power when two-handing", tier: "purple", highlighted: true },
      { name: "Prince of Death's Staff", passive: "Damage negation up while casting spells", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Club", passive: "Improved damage negation at low HP", tier: "common" },
      { name: "Iron Cleaver", passive: "Defeating enemies restores FP", tier: "blue" },
      { name: "Omen Cleaver", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Partisan", passive: "Attack up when wielding two armaments", tier: "blue", highlighted: true },
      { name: "Carian Glintblade Staff", passive: "Taking damage restores FP", tier: "blue" },
      { name: "Rift Shield", passive: "Successful guarding ups poise", tier: "blue" },
      { name: "Envoy's Horn", passive: "Multiple periodical glintblades", tier: "purple", highlighted: true },
    ],
  },
  {
    id: 1,
    specialMerchant: [
      { name: "Ivory Sickle", passive: "Improved guard breaking", tier: "blue" },
      { name: "Forked Greatsword", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Rusted Anchor", passive: "Attacks call vengeful spirits", tier: "blue" },
      { name: "Harp Bow", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved chain attack finishers", tier: "blue" },
      { name: "Full Moon Crossbow", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Giant's Seal", passive: "Less likely to be targeted", tier: "blue" },
      { name: "Golden Beast Crest Shield", passive: "Improved lightning attack power", tier: "blue" },
      { name: "Rivers of Blood", passive: "HP restoration upon landing attacks", tier: "purple" },
      { name: "Golden Halberd", passive: "Improved guard breaking", tier: "purple" },
      { name: "Azur's Glintstone Staff", passive: "Improved spell casting speed", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Zweihander", passive: "Improved damage negation at full HP", tier: "common" },
      { name: "Nightrider Flail", passive: "Improved guard breaking", tier: "blue" },
      { name: "Highland Axe", passive: "HP restoration upon landing attacks", tier: "blue" },
      { name: "Iron Ball", passive: "Improved damage negation at full HP", tier: "blue" },
      { name: "Staff of the Guilty", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Iron Roundshield", passive: "Improved sorceries", tier: "blue", highlighted: true },
      { name: "Siluria's Tree", passive: "Defeating enemies restore HP", tier: "purple" },
    ],
  },

  // ── Placeholders for Sets 2–20. Fill these in as you send each sheet. ────
  ...Array.from({ length: 19 }, (_, i): MerchantSet => ({
    id: i + 2,
    specialMerchant: [],
    normalMerchant: [],
  })),
];

/** Look up a single set by id. Returns undefined if out of range. */
export function getSet(id: number): MerchantSet | undefined {
  return sets.find((s) => s.id === id);
}
