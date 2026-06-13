import type { Seed } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TOWN MAP SEEDS  ·  your data lives here
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  To fill in a seed:
 *    1. Set weapon.name and weapon.passive.
 *    2. (Optional) Drop an image into /public/icons and point weapon.icon at it,
 *       e.g. icon: "/icons/st-trinas-sword.png".
 *    3. Add entries to merchantItems. Only `name` is required; category, cost,
 *       and effect are all optional.
 *
 *  Seed 1 below is a fully worked example. Seeds 2–20 are placeholders —
 *  edit them in place. The grid and detail pages update automatically.
 */
export const seeds: Seed[] = [
  {
    id: 1,
    weapon: {
      name: "St. Trina's Sword",
      passive: "Lightning damage negation up",
      // icon: "/icons/st-trinas-sword.png",
    },
    merchantItems: [
      { name: "Cracked Pot", category: "Key Item", cost: 800, effect: "Reusable throwing pot vessel." },
      { name: "Crimson Flask Charge", category: "Consumable", cost: 1200, effect: "Restores HP on use." },
      { name: "Stonesword Key", category: "Key Item", cost: 2000, effect: "Dispels an imp statue seal." },
      { name: "Smithing Stone [1]", category: "Material", cost: 600, effect: "Reinforces armaments." },
    ],
  },

  // ── Placeholders: replace these as you record each seed ──────────────────
  ...Array.from({ length: 19 }, (_, i): Seed => ({
    id: i + 2,
    weapon: {
      name: "Unrecorded",
      passive: "—",
    },
    merchantItems: [],
  })),
];

/** Look up a single seed by its numeric id. Returns undefined if out of range. */
export function getSeed(id: number): Seed | undefined {
  return seeds.find((s) => s.id === id);
}
