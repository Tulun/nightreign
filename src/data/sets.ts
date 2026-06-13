import type { MerchantSet } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TOWN MAP SETS  ·  your data lives here
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  One entry per "Set" from the reference sheets (Set 0, Set 1, ...).
 *
 *  Each WeaponEntry: { name, passive, tier, highlighted?, icon? }
 *    - tier: "common" (grey) | "blue" | "purple"  — matches the row colour.
 *    - highlighted: true if the row text was yellow in the source sheet.
 *    - icon: optional, e.g. "/icons/envoys-horn.png" (drop art in /public/icons).
 *
 *  The grid card for a set uses the LAST item in `normalMerchant` as its
 *  icon + label (for Set 0 that's Envoy's Horn). Clicking a card shows the
 *  Special Merchant items (and the Normal Merchant items below).
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

  // ── Placeholders for Sets 1–19. Fill these in as you send each sheet. ────
  ...Array.from({ length: 19 }, (_, i): MerchantSet => ({
    id: i + 1,
    specialMerchant: [],
    normalMerchant: [],
  })),
];

/** Look up a single set by id. Returns undefined if out of range. */
export function getSet(id: number): MerchantSet | undefined {
  return sets.find((s) => s.id === id);
}
