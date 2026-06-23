// ─────────────────────────────────────────────────────────────────────────
//  Nightlord / Night-boss raw stat tables (health, per-type damage negation,
//  status resistances, poise) by team size and variant. Stored for future use
//  — not yet surfaced in a view. Source: community Nightreign stats sheet.
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
  poise: number;
  negations: StatNegations;
  resistances: StatResistances;
}

export interface NightlordStatTable {
  team: TeamSize;
  variant: StatVariant;
  /** Source spreadsheet tab gid. */
  gid: number;
  rows: NightlordStatRow[];
}

export const NIGHTLORD_STATS_CREDIT = "Stats from the community Nightreign data sheet";
