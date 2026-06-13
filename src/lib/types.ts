// Core data shapes for the reference app.
// Add new reference categories by creating new types alongside these.

/** A single item sold by the town merchant for a given seed. */
export interface MerchantItem {
  /** Display name, e.g. "Cracked Pot". */
  name: string;
  /** Optional grouping, e.g. "Weapon" | "Talisman" | "Consumable" | "Key Item". */
  category?: string;
  /** Optional rune cost. Leave undefined if unknown / not applicable. */
  cost?: number;
  /** Optional one-line effect or note shown beneath the name. */
  effect?: string;
}

/** One of the 20 town map seeds. */
export interface Seed {
  /** 1–20. Used in the URL (/town-map/3) and as the displayed seal number. */
  id: number;
  /** The weapon associated with this seed. */
  weapon: {
    name: string;
    /** The weapon passive, e.g. "Lightning damage negation up". */
    passive: string;
    /**
     * Path to the icon under /public, e.g. "/icons/st-trinas-sword.png".
     * Leave undefined to show the framed placeholder until you add art.
     */
    icon?: string;
  };
  /** Everything available at the town merchant for this seed. */
  merchantItems: MerchantItem[];
}
