import type { HollowMap } from "@/lib/greatHollow";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GREAT HOLLOW CRYSTAL MAPS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Drop the (watermark-free) map images in /public/maps/ and the markers
 *  overlay on top. x/y are the marker centers as a percentage of the image
 *  (0–100) — tweak them to line up with your images. `width`/`height` should
 *  match your image's real pixel dimensions (used only for aspect ratio).
 */

/** Shown as a small credit on the page (original in-image watermark removed). */
export const GREAT_HOLLOW_CREDIT = "Crystal locations mapped by AlexOGoat & SisterNun";

export const greatHollowMaps: HollowMap[] = [
  {
    id: "surface",
    label: "Surface Map",
    image: "/maps/great-hollow-surface.avif",
    width: 656,
    height: 655,
    crystals: [
      { id: "s1", sets: ["B"], x: 43, y: 19 },
      { id: "s2", sets: ["C"], x: 85, y: 17 },
      { id: "s3", sets: ["B", "C"], x: 31, y: 37 },
      { id: "s4", sets: ["A", "D"], x: 38, y: 42 },
      { id: "s5", sets: ["D"], x: 55, y: 36 },
      { id: "s6", sets: ["A", "B"], x: 72, y: 38 },
      { id: "s7", sets: ["D"], x: 90, y: 40 },
      { id: "s8", sets: ["A", "C"], x: 16, y: 44 },
      { id: "s9", sets: ["D"], x: 8, y: 60 },
      { id: "s10", sets: ["B"], x: 18, y: 60 },
      { id: "s11", sets: ["C", "D"], x: 43, y: 57 },
      { id: "s12", sets: ["A", "B"], x: 33, y: 62 },
      { id: "s13", sets: ["A"], x: 54, y: 70 },
      { id: "s14", sets: ["B", "C"], x: 28, y: 86 },
      { id: "s15", sets: ["A"], x: 40, y: 90 },
    ],
  },
  {
    id: "underground",
    label: "Underground Map",
    image: "/maps/great-hollow-bottom-clean.avif",
    width: 762,
    height: 591,
    crystals: [
      { id: "u1", sets: ["C"], x: 76, y: 20 },
      { id: "u2", sets: ["B"], x: 58, y: 56 },
      { id: "u3", sets: ["A", "D"], x: 89, y: 47 },
      { id: "u4", sets: ["A", "B"], x: 8, y: 48 },
      { id: "u5", sets: ["C", "D"], x: 58, y: 82 },
      { id: "u6", sets: ["C", "D"], x: 92, y: 90 },
    ],
  },
];
