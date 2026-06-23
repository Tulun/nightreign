// ─────────────────────────────────────────────────────────────────────────
//  Block weapons — colossal arms that the Raider (and others) tend to guard
//  with. Physical guard is 100 on every colossal armament, so only affinity
//  Guarded Damage Negation is stored. Mirrors the Greatshield negation block.
// ─────────────────────────────────────────────────────────────────────────

export interface BlockWeapon {
  id: string;
  name: string;
  /** Guarded Damage Negation (%) per affinity. Physical is 100 (omitted). */
  negation: { magic: number; fire: number; lightning: number; holy: number };
  /** Guard Boost (stability). */
  guardBoost: number;
}
