// ─────────────────────────────────────────────────────────────────────────
//  Bagcraft (Scholar) — consumables and their level 1 / 2 / 3 effects.
//  Data from the Fextralife Magic/Bagcraft pages + the community effect sheet.
// ─────────────────────────────────────────────────────────────────────────

export type BagcraftCategory =
  | "Stone"
  | "Tear"
  | "Boluses"
  | "Food"
  | "Grease"
  | "Aromatic"
  | "Artifact"
  | "Dart"
  | "Throwing Pot";

export interface BagcraftItem {
  id: string;
  name: string;
  category: BagcraftCategory;
  /** Effect at each level (level 1 is the base consumable). */
  l1: string;
  l2: string;
  l3: string;
  /** Icon under public/ (from the Fextralife wiki), where we have one. */
  icon?: string;
}

/** Display order of the category filter. */
export const BAGCRAFT_CATEGORIES: BagcraftCategory[] = [
  "Stone",
  "Tear",
  "Boluses",
  "Food",
  "Grease",
  "Aromatic",
  "Artifact",
  "Dart",
  "Throwing Pot",
];
