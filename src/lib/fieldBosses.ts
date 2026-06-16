// ─────────────────────────────────────────────────────────────────────────
//  Field boss loot pools. The 29 field bosses are split into Low / Mid / High
//  tiers; each tier has its own loot pool of slots. Weapon slots roll a rarity,
//  and a Dormant Power slot rolls a power of a given tier.
// ─────────────────────────────────────────────────────────────────────────

export type TierKey = "low" | "mid" | "high";

export type OutcomeKind =
  | "blue"
  | "class-blue"
  | "purple"
  | "class-purple"
  | "red"
  | "class-red"
  | "legendary"
  | "power"
  | "special";

export interface LootOutcome {
  /** Chance in percent. */
  chance: number;
  label: string;
  kind: OutcomeKind;
}

export interface LootSlot {
  name: string;
  outcomes: LootOutcome[];
}

export interface FieldBossTier {
  key: string;
  label: string;
  poolLabel: string;
  /** Accent color for the tier. */
  accent: string;
  /** Field bosses in this tier. */
  bosses: string[];
  /** Loot slots (empty until recorded). */
  slots: LootSlot[];
  /** Dormant Power tier(s) this pool's power slot draws from. */
  powerTierKeys: string[];
}

export interface PowerTier {
  key: string;
  label: string;
  powers: string[];
}

export interface LegendaryWeapon {
  name: string;
  /** Chance (%) that a legendary drop is this weapon. */
  chance: number;
  /** Highlighted red on the source (red-tier exclusive). */
  red?: boolean;
}

export const OUTCOME_COLOR: Record<OutcomeKind, string> = {
  blue: "#3ea6e0",
  "class-blue": "#3ec9c9",
  purple: "#a571e6",
  "class-purple": "#d65fd6",
  red: "#e0322e",
  "class-red": "#f0851e",
  legendary: "#e3a93c",
  power: "#4a9a3a",
  special: "#d9433f",
};
