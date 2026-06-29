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
    recipe: ["magic"], note: "Lasts ~10s",
    description:
      "Enwreathe an enemy in magic that deals Magic damage for some time, encircling and attacking the target." },
  { id: "carian-slicer", name: "Carian Slicer", category: "unholy",
    recipe: ["magic", "lightning"], note: "Can hold",
    description:
      "Execute a broad forward slash with a magical blade. Hold to move with the sword drawn. Deals Lightning damage." },
  { id: "gravity-blast", name: "Gravity Blast", category: "unholy",
    recipe: ["magic", "fire", "lightning"], note: "Succs",
    description:
      "Conjure a frontwards exploding gravity orb. The orb pulls enemies inward, expands, and explodes, inflicting heavy Magic damage." },
  { id: "tracking-wraith", name: "Tracking Wraith", category: "unholy",
    recipe: ["magic", "fire"], note: "Lasts ~10s, explodes",
    description:
      "Launch a wraith flame that pursues enemies. Deals Fire damage." },
  { id: "bloodhounds-step-buff", name: "Blink Step", category: "unholy",
    recipe: ["lightning"], note: "~20s, self",
    description:
      "Enwreathe oneself in lightning, bolstering dodging actions. Lasts 20 seconds." },
  { id: "blinkbolt", name: "Blinkbolt", category: "unholy",
    recipe: ["fire", "lightning"], note: "Explodes",
    description:
      "Become a fireball and barrel forward, raining lightning on nearby foes. Deals Lightning damage." },
  { id: "molotov", name: "Molotov", category: "unholy",
    recipe: ["fire"], note: "Lingers ~5s",
    description:
      "Throw a whirlwind of flame. Flame spreads across a small area upon contact and burns for some time." },

  // ── Holy (recipe includes Holy) ───────────────────────────────────────────
  { id: "infinite-mana", name: "Infinite Mana", category: "holy",
    recipe: ["magic", "holy"], note: "~8s, allies",
    description:
      "Cover a nearby area with a magical veil, fully conserving FP for self and allies for 8 seconds." },
  { id: "ice-block-storm", name: "Ice Block Storm", category: "holy",
    recipe: ["magic", "lightning", "holy"], note: "Invuln ~5s",
    description:
      "Create a cold storm with a frostbite-buildup area effect and retreat inside an ice block, gaining invulnerability. Deals Magic damage." },
  { id: "armor-buff", name: "Armor Buff", category: "holy",
    recipe: ["holy"], note: "30s, self",
    description:
      "Enwreathe oneself in holy light, bolstering poise and increasing all damage negation by 10%. Enemy attacks that cause minor stagger can instead be poised through. Lasts 30 seconds." },
  { id: "mixed-breath", name: "Mixed Breath", category: "holy",
    recipe: ["magic", "fire", "holy"], note: "Channel ~3s",
    description:
      "Spew a mixed-affinity breath that inflicts Fire damage upon enemies, and restores HP and FP of allies on contact." },
  { id: "auto-parry-buff", name: "Auto-Parry Buff", category: "holy",
    recipe: ["lightning", "holy"], note: "~15s, self",
    description:
      "Weave a layer of lightning that parries enemy attacks for a short time. Also deflects spell projectiles without an AoE component. Physical attacks that can't be parried have all damage nullified at the cost of stamina — effectively a 100% physical-reduction shield that cannot be guard-broken and auto-parries with Thop's Barrier. You can still be hit from behind or grabbed. Lasts 15 seconds." },
  { id: "lightning-rod", name: "Lightning Rod", category: "holy",
    recipe: ["fire", "lightning", "holy"], note: "Lingers ~5s, explodes",
    description:
      "Create a lightning rod and thrust it forward into the terrain. White lightning strikes the rod after a short delay. Deals Lightning damage on the initial stake as well as the lightning-strike follow-up." },
  { id: "warming-stone", name: "Warming Stone", category: "holy",
    recipe: ["fire", "holy"], note: "Aoe ~16s, +30% HP buff 60s",
    description:
      "Raise a torch for a limited time that raises max HP of self and nearby allies by 30%, reduces status-ailment gauge buildup for nearby allies, and lowers max HP of nearby enemies. Ailment buildup ticks down by 5 every half second while within range. The torch dissipates after 15 seconds, and max HP returns to normal 60 seconds after last being in range (up to 75 seconds total)." },
];
