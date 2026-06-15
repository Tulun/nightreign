// ─────────────────────────────────────────────────────────────────────────
//  Recluse's Magic Cocktails reference.
//
//  Each cocktail is brewed from a 3-element recipe and grouped Unholy / Holy.
//  Recipe elements reuse the affinity icons under /public/icons/elements.
// ─────────────────────────────────────────────────────────────────────────

export type Element = "magic" | "fire" | "lightning" | "holy";
export type CocktailCategory = "unholy" | "holy";

/** Recipe-element icons (the affinity icons added earlier). */
export const ELEMENT_ICON: Record<Element, string> = {
  magic: "/icons/elements/magic-affinity.png",
  fire: "/icons/elements/fire-affinity.png",
  lightning: "/icons/elements/lightning-affinity.png",
  holy: "/icons/elements/holy-affinity.png",
};

export interface Cocktail {
  /** Slug, e.g. "tracking-wisp". */
  id: string;
  name: string;
  category: CocktailCategory;
  /** The three input elements, in order. */
  recipe: Element[];
  /** Short effect note, e.g. "lasts ~10s". */
  note: string;
  /** Optional icon under /public, e.g. "/icons/cocktails/molotov.png". */
  icon?: string;
}

export const COCKTAIL_CATEGORIES: { key: CocktailCategory; label: string }[] = [
  { key: "unholy", label: "Unholy" },
  { key: "holy", label: "Holy" },
];
