// ─────────────────────────────────────────────────────────────────────────
//  Great Hollow crystal sets.
//
//  Crystals spawn in one of four sets (A/B/C/D). Each map location holds a
//  crystal in one or two of those sets (its label). Clicking the crystals you
//  see narrows the run's set to the INTERSECTION of the clicked crystals' sets;
//  locations not in any remaining candidate set are dimmed.
// ─────────────────────────────────────────────────────────────────────────

export type CrystalSet = "A" | "B" | "C" | "D";

export const ALL_SETS: CrystalSet[] = ["A", "B", "C", "D"];

export interface Crystal {
  /** Unique id across both maps (used for selection state). */
  id: string;
  /** The set(s) this location's crystal belongs to. */
  sets: CrystalSet[];
  /** Marker center as a percentage of the map image (0–100). */
  x: number;
  y: number;
}

export interface HollowMap {
  id: "surface" | "underground";
  label: string;
  /** Image under /public, e.g. "/maps/great-hollow-surface.png". */
  image: string;
  /** Intrinsic image size (for aspect ratio). Use your file's real dimensions. */
  width: number;
  height: number;
  crystals: Crystal[];
}

/**
 * Candidate sets given the observed (clicked) crystals: the sets that every
 * observed crystal belongs to. No selection → all four sets.
 */
export function candidateSets(observed: Crystal[]): CrystalSet[] {
  if (observed.length === 0) return [...ALL_SETS];
  return ALL_SETS.filter((s) => observed.every((c) => c.sets.includes(s)));
}
