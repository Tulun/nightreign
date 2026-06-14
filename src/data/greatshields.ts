import type { Greatshield } from "@/lib/greatshields";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GREATSHIELD DATA  ·  Guarded Damage Negation (%)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  One entry per greatshield. The /greatshields view ranks them per affinity
 *  automatically, so you only list each shield once with its full block.
 *
 *  - negation: physical is 100 for all greatshields; fill the elemental values.
 *  - guardBoost: the Guard Boost (stability) number.
 *  - icon: drop a square PNG in /public/icons/greatshields/ and point here.
 *
 *  Template (the full stat block visible in the source image):
 *
 *    {
 *      id: "example-greatshield",
 *      name: "Example Greatshield",
 *      icon: "/icons/greatshields/example-greatshield.png",
 *      negation: { physical: 100, magic: 59, fire: 66, lightning: 53, holy: 62 },
 *      guardBoost: 60,
 *    },
 */
export const greatshields: Greatshield[] = [
  // Add greatshields here.
];
