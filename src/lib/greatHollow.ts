// ─────────────────────────────────────────────────────────────────────────
//  Great Hollow crystal reference maps.
//
//  Crystals spawn in one of four sets (A/B/C/D). The labeled "Colorblinded"
//  maps show every spawn location and the set(s) each crystal belongs to —
//  displayed as a static reference to match against what you see in a run.
// ─────────────────────────────────────────────────────────────────────────

export interface HollowMap {
  id: "surface" | "underground";
  label: string;
  /** Labeled reference image under /public, e.g. "/maps/…-labeled.webp". */
  image: string;
  /** Intrinsic image size (for aspect ratio). Use the file's real dimensions. */
  width: number;
  height: number;
}
