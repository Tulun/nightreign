// ─────────────────────────────────────────────────────────────────────────
//  Greatshield reference (Guardian) — guarded damage negation by affinity.
//
//  Each greatshield carries its full Guarded Damage Negation block. The view
//  ranks them per affinity automatically, so you only enter each shield once.
// ─────────────────────────────────────────────────────────────────────────

export type Affinity = "physical" | "magic" | "fire" | "lightning" | "holy";

/** Guarded Damage Negation (%), one value per affinity. */
export type GuardedNegation = Record<Affinity, number>;

export interface Greatshield {
  /** Slug used as a key, e.g. "jellyfish-shield". */
  id: string;
  /** Display name, e.g. "Jellyfish Shield". */
  name: string;
  /** Icon under /public, e.g. "/icons/greatshields/jellyfish-shield.png". */
  icon?: string;
  /** Guarded Damage Negation block. Physical is 100 for all greatshields. */
  negation: GuardedNegation;
  /** Guard Boost (stability). */
  guardBoost: number;
  /** Optional free-text note shown in the detail modal. */
  notes?: string;
}

/** The affinities the reference groups by (physical is always 100, so omitted). */
export const RANKED_AFFINITIES: { key: Affinity; label: string }[] = [
  { key: "holy", label: "Holy" },
  { key: "magic", label: "Magic" },
  { key: "fire", label: "Fire" },
  { key: "lightning", label: "Lightning" },
];

/** Full stat-block order shown in the detail modal (matches the source image). */
export const STAT_ORDER: { key: Affinity; label: string }[] = [
  { key: "physical", label: "Physical" },
  { key: "magic", label: "Magic" },
  { key: "fire", label: "Fire" },
  { key: "lightning", label: "Lightning" },
  { key: "holy", label: "Holy" },
];

/** Accent color per affinity, used for the section dots. */
export const AFFINITY_COLOR: Record<Affinity, string> = {
  physical: "#cfcad1",
  magic: "#5aa0e0",
  fire: "#e08a4a",
  lightning: "#e3c45a",
  holy: "#ecdf9a",
};

/** Greatshields sorted by a given affinity's negation, best first. */
export function rankByAffinity(
  shields: Greatshield[],
  affinity: Affinity,
  limit?: number,
): Greatshield[] {
  const sorted = [...shields].sort((a, b) => b.negation[affinity] - a.negation[affinity]);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}
