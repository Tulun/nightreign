// ─────────────────────────────────────────────────────────────────────────
//  Bosses — Night 1 / Night 2 (end-of-day) bosses and Field bosses, with their
//  combat info: damage negations, status resistances, stance, parryability,
//  and the weak-to / stronger-vs summary. Reuses the negation/status types
//  shared with the Nightlords feature.
// ─────────────────────────────────────────────────────────────────────────

import type { NegationKey, Resist, StatusKey } from "@/lib/nightlords";

export type { NegationKey, Resist, StatusKey };

export type BossCategory = "night1" | "night2" | "field";

export interface BossDrop {
  /** Where this drop applies (e.g. "Night Boss", "The Crater", "Castle Basement"). */
  source: string;
  /** Rune values keyed by team size. */
  solo?: number;
  duo?: number;
  trio?: number;
  /** Reward quality note (e.g. "Strong Crater Reward"). */
  reward?: string;
}

export interface Boss {
  id: string;
  name: string;
  /** Tabs this boss appears under (a creature can be both a night & field boss). */
  categories: BossCategory[];
  /** Night bosses: which Nightlord expeditions this boss can appear in. */
  spawnsIn?: string[];
  /** Field bosses: location types where it appears. */
  locations?: string[];
  /** Flavor quote from the wiki, if any. */
  quote?: string;
  stance?: number;
  parryable?: boolean;
  /** Damage types the boss deals. */
  damageDealt?: NegationKey[];
  negations: Record<NegationKey, number>;
  resistances: Record<StatusKey, Resist>;
  /** Damage types it takes MORE from (negative negation). */
  weakTo: NegationKey[];
  /** Damage types it resists. */
  strongerVs: NegationKey[];
  drops?: BossDrop[];
  note?: string;
}

export const BOSS_CATEGORIES: { key: BossCategory; label: string }[] = [
  { key: "night1", label: "Night 1 Bosses" },
  { key: "night2", label: "Night 2 Bosses" },
  { key: "field", label: "Field Bosses" },
];

export const BOSS_CREDIT = "Stats from eldenringnightreign.wiki.fextralife.com";
