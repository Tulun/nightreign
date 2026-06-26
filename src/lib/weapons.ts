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

/** Affinity icons for table headers (physical/crit have no affinity icon). */
export const AFFINITY_ICON: Record<string, string> = {
  magic: "/icons/elements/magic-affinity.png",
  fire: "/icons/elements/fire-affinity.png",
  lightning: "/icons/elements/lightning-affinity.png",
  holy: "/icons/elements/holy-affinity.png",
};

// ── Physical damage type (Attack Affinity), from the Fextralife weapon pages ──
export type DamageType = "standard" | "slash" | "strike" | "pierce";

export const DAMAGE_TYPE_ICON: Record<DamageType, string> = {
  standard: "/icons/elements/standard.png",
  slash: "/icons/elements/slash.png",
  strike: "/icons/elements/strike.png",
  pierce: "/icons/elements/pierce.png",
};

export const DAMAGE_TYPE_LABEL: Record<DamageType, string> = {
  standard: "Standard",
  slash: "Slash",
  strike: "Strike",
  pierce: "Pierce",
};

// Damage type is constant within a weapon class for every class EXCEPT Colossal
// Weapon and Whip (which mix axe/hammer/etc.) — those are per-weapon overrides.
const DAMAGE_BY_CLASS: Record<string, DamageType[]> = {
  Dagger: ["slash", "pierce"],
  "Straight Sword": ["standard", "pierce"],
  Greatsword: ["standard", "pierce"],
  "Colossal Sword": ["standard", "pierce"],
  "Thrusting Sword": ["standard", "pierce"],
  "Heavy Thrusting Sword": ["standard", "pierce"],
  "Curved Sword": ["slash"],
  "Curved Greatsword": ["slash"],
  Katana: ["slash", "pierce"],
  Twinblade: ["standard", "pierce"],
  Axe: ["standard"],
  Greataxe: ["standard"],
  Hammer: ["strike"],
  Flail: ["strike"],
  "Great Hammer": ["strike"],
  Spear: ["pierce"],
  "Great Spear": ["pierce"],
  Halberd: ["standard", "pierce"],
  Reaper: ["slash"],
  Fist: ["strike"],
  Claw: ["slash", "pierce"],
  Bow: ["pierce"],
  Greatbow: ["pierce"],
  Crossbow: ["pierce"],
  Ballista: ["pierce"],
  "Glintstone Staff": ["strike"],
  "Sacred Seal": ["strike"],
  Torch: ["strike"],
};

const DAMAGE_BY_NAME: Record<string, DamageType[]> = {
  // Colossal Weapons (mixed within the class)
  "Axe of Godfrey": ["standard"],
  "Dragon Greatclaw": ["standard"],
  "Duelist Greataxe": ["standard"],
  "Envoy's Greathorn": ["strike"],
  "Fallingstar Beast Jaw": ["pierce"],
  "Ghiza's Wheel": ["standard"],
  "Giant-Crusher": ["strike"],
  "Golem's Halberd": ["standard", "pierce"],
  "Great Club": ["strike"],
  "Prelate's Inferno Crozier": ["strike"],
  "Raider's Greataxe": ["standard"],
  "Rotten Greataxe": ["standard"],
  "Rotten Staff": ["strike"],
  "Staff of the Avatar": ["strike"],
  "Troll's Hammer": ["strike"],
  "Watchdog's Staff": ["strike"],
  // Whips (mixed within the class)
  "Giant's Red Braid": ["strike"],
  "Hoslow's Petal Whip": ["strike"],
  "Magma Whip Candlestick": ["strike"],
  "Thorned Whip": ["strike"],
  Urumi: ["slash"],
  Whip: ["strike"],
};

/** Physical damage type(s) for a weapon: per-name override, else by class. */
export function damageTypesFor(name: string, type: string): DamageType[] {
  return DAMAGE_BY_NAME[name] ?? DAMAGE_BY_CLASS[type] ?? [];
}

export const RARITY_META: Record<WeaponRarity, { label: string; color: string }> = {
  normal: { label: "Common", color: "#e8e2d2" },
  blue: { label: "Rare", color: "#5aa8e6" },
  purple: { label: "Epic", color: "#b07ce8" },
  gold: { label: "Legendary", color: "#e3b23c" },
};

/** Rarity backdrop composited behind weapon icons (Legendary uses the gold/yellow art). */
export const RARITY_FRAMES: Record<WeaponRarity, string> = {
  normal: "/icons/weapons/backgrounds/white.png",
  blue: "/icons/weapons/backgrounds/blue.png",
  purple: "/icons/weapons/backgrounds/purple.png",
  gold: "/icons/weapons/backgrounds/yellow.png",
};

export const WEAPON_CREDIT = "Stats from eldenringnightreign.wiki.fextralife.com";
