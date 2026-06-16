// ─────────────────────────────────────────────────────────────────────────
//  Bosses — Night 1 / Night 2 (end-of-day) bosses and Field bosses, with their
//  combat info: damage negations, status resistances, stance, parryability,
//  and the weak-to / stronger-vs summary. Reuses the negation/status types
//  shared with the Nightlords feature.
// ─────────────────────────────────────────────────────────────────────────

import type { NegationKey, Resist, StatusKey } from "@/lib/nightlords";

export type { NegationKey, Resist, StatusKey };

export type BossCategory = "night1" | "night2" | "field";

/** A stat that scales with team size (solo · / duo ·· / trio ∴). */
export interface TeamStat {
  solo?: number;
  duo?: number;
  trio?: number;
}

/**
 * A location/encounter variant of a boss. The same creature can appear as a
 * Night Boss, Field Boss, Castle Basement, Castle Rooftop, etc., sharing
 * negations/resistances but differing in HP, rune drops, and attack power.
 */
export interface BossVariant {
  /** e.g. "Night Boss", "Field Boss", "Castle Basement", "The Crater". */
  label: string;
  /** HP per team size. */
  hp?: TeamStat;
  /** Rune reward per team size. */
  runes?: TeamStat;
  /** Reward quality note (e.g. "Strong Field Boss Reward"). */
  reward?: string;
  /** Per-variant note (expeditions, attack-power difference, conditions). */
  note?: string;
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
  /** Per-location/encounter variants with their own HP & rune drops. */
  variants?: BossVariant[];
  note?: string;
}

export const BOSS_CATEGORIES: { key: BossCategory; label: string }[] = [
  { key: "night1", label: "Night 1 Bosses" },
  { key: "night2", label: "Night 2 Bosses" },
  { key: "field", label: "Field Bosses" },
];

export const DAMAGE_LABEL: Record<NegationKey, string> = {
  standard: "Standard",
  slash: "Slash",
  strike: "Strike",
  pierce: "Pierce",
  magic: "Magic",
  fire: "Fire",
  lightning: "Lightning",
  holy: "Holy",
};

export const BOSS_CREDIT = "Stats from eldenringnightreign.wiki.fextralife.com";
