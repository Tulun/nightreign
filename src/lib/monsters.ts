// ─────────────────────────────────────────────────────────────────────────
//  Monster / enemy reference data, stored for future use (not yet surfaced).
//  - `monsters` (data/monsters.ts): bosses with per-type damage negation,
//    status resistances, weakness summary and tips. Covers Nightlords, their
//    Everdark variants, and end-of-day / location ("endboss") fights.
//  - `regularEnemies` (data/regularEnemies.ts): the trash-mob roster with wiki
//    slugs, ready for later per-page scraping (location / drops / weak-to).
//  Source: nightreign-calculator.netlify.app + Fextralife Nightreign wiki.
// ─────────────────────────────────────────────────────────────────────────

export type MonsterType = "nightlord" | "everdark" | "endboss";

/** Per-type damage negation (%). Negative = weakness (takes extra damage). */
export interface MonsterNegation {
  standard: number;
  slash: number;
  strike: number;
  thrust: number;
  magic: number;
  fire: number;
  lightning: number;
  holy: number;
}

/** Status-effect resistance (buildup to proc). null = immune / not applicable. */
export interface MonsterStatus {
  poison: number | null;
  rot: number | null;
  bleed: number | null;
  frost: number | null;
  sleep: number | null;
  madness: number | null;
}

export interface MonsterPhase {
  name: string;
  color?: string;
  dmg?: MonsterNegation;
  status?: MonsterStatus;
  note?: string;
}

export interface Monster {
  id: string;
  name: string;
  subtitle?: string;
  type: MonsterType;
  dmg?: MonsterNegation;
  status?: MonsterStatus;
  /** Best damage type(s) to use. */
  bestDmg?: string;
  /** Best status effect(s) to apply. */
  bestStatus?: string;
  tips?: string[];
  phases?: MonsterPhase[];
}

export interface RegularEnemy {
  name: string;
  /** Fextralife wiki page slug (e.g. "Banished+Knight"). */
  slug: string;
}

export const MONSTER_CREDIT = "Boss data from nightreign-calculator.netlify.app; enemy roster from the Fextralife Nightreign wiki";
