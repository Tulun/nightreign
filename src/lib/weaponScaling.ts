// ─────────────────────────────────────────────────────────────────────────
//  Weapon scaling — Attack Power at Lv12 (no relics) per base Nightfarer,
//  illustrating which heroes get the most out of each weapon. Stored for
//  future use (e.g. a "best user" column on the Weapons page, or feeding the
//  attack calculator). Source: community weapon-scaling sheet.
// ─────────────────────────────────────────────────────────────────────────

/** Lv12 AP per base hero. Scholar & Undertaker are absent from the source. */
export interface ScalingByHero {
  wylder: number;
  guardian: number;
  ironeye: number;
  duchess: number;
  raider: number;
  revenant: number;
  recluse: number;
  executor: number;
}

export interface WeaponScaling {
  name: string;
  /** Base status buildup noted on the weapon (e.g. "30 bleed", "56 Rot"). */
  status?: string;
  ap: Partial<ScalingByHero>;
}

export const WEAPON_SCALING_CREDIT = "Lv12 AP figures from the community Nightreign weapon-scaling sheet";
