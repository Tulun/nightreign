// ─────────────────────────────────────────────────────────────────────────
//  Weapons — the full armament index: type, rarity, attack power, attribute
//  scaling, innate status, weapon skill, and unique effect. Data from the
//  Fextralife Nightreign wiki category tables.
// ─────────────────────────────────────────────────────────────────────────

export type WeaponRarity = "normal" | "blue" | "purple" | "gold";

export interface WeaponAP {
  physical?: number | null;
  magic?: number | null;
  fire?: number | null;
  lightning?: number | null;
  holy?: number | null;
  crit?: number | null;
}

export interface WeaponScaling {
  str?: string | null;
  dex?: string | null;
  int?: string | null;
  fai?: string | null;
  arc?: string | null;
}

export interface Weapon {
  name: string;
  /** Weapon type, e.g. "Dagger", "Greatsword", "Glintstone Staff". */
  type: string;
  rarity?: WeaponRarity;
  ap?: WeaponAP;
  scaling?: WeaponScaling;
  /** Innate status buildup, e.g. "Blood Loss", "Frost", "Poison". */
  status?: string | null;
  /** Weapon skill / Ash of War. */
  skill?: string | null;
  /** Unique passive effect. */
  effect?: string | null;
}

export const SCALING_STATS: { key: keyof WeaponScaling; label: string }[] = [
  { key: "str", label: "Str" },
  { key: "dex", label: "Dex" },
  { key: "int", label: "Int" },
  { key: "fai", label: "Fai" },
  { key: "arc", label: "Arc" },
];

export const AP_COLUMNS: { key: keyof WeaponAP; label: string }[] = [
  { key: "physical", label: "Phys" },
  { key: "magic", label: "Mag" },
  { key: "fire", label: "Fire" },
  { key: "lightning", label: "Lit" },
  { key: "holy", label: "Holy" },
  { key: "crit", label: "Crit" },
];

export const RARITY_META: Record<WeaponRarity, { label: string; color: string }> = {
  normal: { label: "Common", color: "#e8e2d2" },
  blue: { label: "Rare", color: "#5aa8e6" },
  purple: { label: "Epic", color: "#b07ce8" },
  gold: { label: "Legendary", color: "#e3b23c" },
};

export const WEAPON_CREDIT = "Stats from eldenringnightreign.wiki.fextralife.com";
