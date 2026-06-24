import type { HollowMap } from "@/lib/greatHollow";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GREAT HOLLOW CRYSTAL REFERENCE MAPS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  The labeled "Colorblinded" maps live in /public/maps/. Each crystal is
 *  marked with the set(s) it belongs to (A/B/C/D), shown as a static reference.
 */

/** Shown as a small credit on the page. */
export const GREAT_HOLLOW_CREDIT = "Crystal locations mapped by AlexOGoat & SisterNun";

export const greatHollowMaps: HollowMap[] = [
  {
    id: "surface",
    label: "Surface Map",
    image: "/maps/great-hollow-surface-labeled.webp",
    width: 1080,
    height: 1080,
  },
  {
    id: "underground",
    label: "Underground Map",
    image: "/maps/great-hollow-underground-labeled.webp",
    width: 1080,
    height: 1080,
  },
];
