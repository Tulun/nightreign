import type { Cocktail } from "@/lib/cocktails";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  RECLUSE'S MAGIC COCKTAILS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Recipes are the distinct affinities mixed (1 = "pure", 2, or 3), per the
 *  Fextralife Magic Cocktail page. The Unholy / Holy split is simply whether
 *  the recipe includes Holy. Names + short notes from the community chart.
 *  Drop an icon in /public/icons/cocktails/<id>.png to replace the placeholder.
 */

export const COCKTAIL_CREDIT = "Recluse cocktail chart by HacePloder";

export const cocktails: Cocktail[] = [
  // ── Unholy (no Holy in recipe) ───────────────────────────────────────────
  { id: "tracking-wisp", name: "Tracking Wisp", category: "unholy",
    recipe: ["magic"], note: "Lasts ~10s" },
  { id: "carian-slicer", name: "Carian Slicer", category: "unholy",
    recipe: ["magic", "lightning"], note: "Can hold" },
  { id: "gravity-blast", name: "Gravity Blast", category: "unholy",
    recipe: ["magic", "fire", "lightning"], note: "Succs" },
  { id: "tracking-wraith", name: "Tracking Wraith", category: "unholy",
    recipe: ["magic", "fire"], note: "Lasts ~10s, explodes" },
  { id: "bloodhounds-step-buff", name: "Bloodhound's Step Buff", category: "unholy",
    recipe: ["lightning"], note: "~20s, self" },
  { id: "blinkbolt", name: "Blinkbolt", category: "unholy",
    recipe: ["fire", "lightning"], note: "Explodes" },
  { id: "molotov", name: "Molotov", category: "unholy",
    recipe: ["fire"], note: "Lingers ~5s" },

  // ── Holy (recipe includes Holy) ───────────────────────────────────────────
  { id: "infinite-mana", name: "Infinite Mana", category: "holy",
    recipe: ["magic", "holy"], note: "~8s, allies" },
  { id: "ice-block-storm", name: "Ice Block Storm", category: "holy",
    recipe: ["magic", "lightning", "holy"], note: "Invuln ~5s" },
  { id: "armor-buff", name: "Armor Buff", category: "holy",
    recipe: ["holy"], note: "30s, self" },
  { id: "mixed-breath", name: "Mixed Breath", category: "holy",
    recipe: ["magic", "fire", "holy"], note: "Channel ~3s" },
  { id: "auto-parry-buff", name: "Auto-Parry Buff", category: "holy",
    recipe: ["lightning", "holy"], note: "~15s, self" },
  { id: "lightning-rod", name: "Lightning Rod", category: "holy",
    recipe: ["fire", "lightning", "holy"], note: "Lingers ~5s, explodes" },
  { id: "warming-stone", name: "Warming Stone", category: "holy",
    recipe: ["fire", "holy"], note: "Aoe ~16s, +30% HP buff 60s" },
];
