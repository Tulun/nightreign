// ─────────────────────────────────────────────────────────────────────────
//  Chalices (vessels) — each grants three relic slots; several change their
//  slot colors during Deep of Night expeditions.
// ─────────────────────────────────────────────────────────────────────────

/** Slot colors. White is the universal slot (accepts any relic). */
export type SlotColor = "Red" | "Blue" | "Green" | "Yellow" | "White";

/** The in-game slot symbols (downloaded from the wiki). */
export const SLOT_ICON: Record<SlotColor, string> = {
  Red: "/icons/relics/slot-red.png",
  Blue: "/icons/relics/slot-blue.png",
  Green: "/icons/relics/slot-green.png",
  Yellow: "/icons/relics/slot-yellow.png",
  White: "/icons/relics/slot-white.png",
};

export interface Chalice {
  name: string;
  /** Relic slot colors, in order. */
  slots: [SlotColor, SlotColor, SlotColor];
  /** Slot colors during Deep of Night expeditions. */
  deep: [SlotColor, SlotColor, SlotColor];
  /** How it's obtained. */
  source: string;
}

export interface CharacterChalices {
  name: string;
  /** The character's chalices, in game order. */
  chalices: Chalice[];
}

/** Whether a chalice's Deep of Night slots differ from its normal slots. */
export function deepDiffers(c: Chalice): boolean {
  return c.slots.some((s, i) => s !== c.deep[i]);
}
