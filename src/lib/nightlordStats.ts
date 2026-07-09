// ─────────────────────────────────────────────────────────────────────────
//  Nightlord / Night-boss raw stat tables (health, per-type damage negation,
//  status resistances, poise) by team size and variant. Surfaced on the
//  Nightlords page. Source: community Nightreign stats sheet.
// ─────────────────────────────────────────────────────────────────────────

export type TeamSize = "solo" | "duo" | "trio";
export type StatVariant = "normal" | "everdark";

/** A status resistance value, or "Immune". */
export type ResistValue = number | "Immune";

/** Per-type damage negation %. Negative = weakness (takes extra damage). */
export interface StatNegations {
  phys: number;
  strike: number;
  slash: number;
  pierce: number;
  magic: number;
  fire: number;
  lightning: number;
  holy: number;
}

export interface StatResistances {
  poison: ResistValue;
  rot: ResistValue;
  bleed: ResistValue;
  frost: ResistValue;
  sleep: ResistValue;
  madness: ResistValue;
  blight: ResistValue;
}

export interface NightlordStatRow {
  name: string;
  /** In-game entity ID from the sheet. */
  id: number;
  /** Max HP; null where the sheet leaves it unknown ("?"). */
  health: number | null;
  /** null = undocumented (stub rows only; the sheet always has it). */
  poise: number | null;
  negations: StatNegations;
  resistances: StatResistances;
  /** Shown under the stat block — e.g. sourcing caveat for stubbed rows. */
  note?: string;
}

export interface NightlordStatTable {
  team: TeamSize;
  variant: StatVariant;
  /** Source spreadsheet tab gid. */
  gid: number;
  rows: NightlordStatRow[];
}

export const NIGHTLORD_STATS_CREDIT = "Stats from the community Nightreign data sheet";

/** Team-size picker options, in player-count order. */
export const TEAM_OPTIONS: { key: TeamSize; players: number }[] = [
  { key: "solo", players: 1 },
  { key: "duo", players: 2 },
  { key: "trio", players: 3 },
];

/** Negation columns for the stat tables (keys differ from lib/nightlords). */
export const STAT_NEGATION_COLUMNS: { key: keyof StatNegations; label: string; icon: string }[] = [
  { key: "phys", label: "Phys", icon: "/icons/elements/standard.png" },
  { key: "strike", label: "Strike", icon: "/icons/elements/strike.png" },
  { key: "slash", label: "Slash", icon: "/icons/elements/slash.png" },
  { key: "pierce", label: "Pierce", icon: "/icons/elements/pierce.png" },
  { key: "magic", label: "Magic", icon: "/icons/elements/magic-affinity.png" },
  { key: "fire", label: "Fire", icon: "/icons/elements/fire-affinity.png" },
  { key: "lightning", label: "Ltng", icon: "/icons/elements/lightning-affinity.png" },
  { key: "holy", label: "Holy", icon: "/icons/elements/holy-affinity.png" },
];

/** Status-resistance columns for the stat tables (adds Rot & Blight vs the old view). */
export const STAT_STATUS_COLUMNS: { key: keyof StatResistances; label: string; icon?: string }[] = [
  { key: "poison", label: "Poison", icon: "/icons/status/poison.png" },
  { key: "rot", label: "Rot", icon: "/icons/status/rot.png" },
  { key: "bleed", label: "Bleed", icon: "/icons/status/bleed.png" },
  { key: "frost", label: "Frost", icon: "/icons/status/frost.png" },
  { key: "sleep", label: "Sleep", icon: "/icons/status/sleep.png" },
  { key: "madness", label: "Madness", icon: "/icons/status/madness.png" },
  { key: "blight", label: "Blight" },
];

/**
 * Depths of Night scaling for Nightlords — HP & damage boost % per depth.
 * Mirrors the "Nightlord" row of the Depth Buffs table (src/data/depthBuffs.ts).
 */
export const NIGHTLORD_DEPTH_BUFFS: { depth: 1 | 2 | 3 | 4 | 5; hp: number; dmg: number }[] = [
  { depth: 1, hp: 25, dmg: 25 },
  { depth: 2, hp: 40, dmg: 55 },
  { depth: 3, hp: 57, dmg: 92 },
  { depth: 4, hp: 95, dmg: 183 },
  { depth: 5, hp: 116, dmg: 231 },
];

/** Points one displayed stat block at a named row of the stat tables. */
export interface NightlordStatBlockRef {
  /** Heading shown above the block when a boss has several (phases/forms). */
  label?: string;
  /** Row `name` in the stat tables for the selected team size & variant. */
  row: string;
}
