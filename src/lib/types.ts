// Core data shapes for the town-map shop reference.

export type ShopRarity = "White" | "Blue" | "Purple" | "Red";

/** Rarity colour + icon backdrop for the shop weapons. */
export const SHOP_RARITY: Record<ShopRarity, { label: string; color: string; frame: string }> = {
  White: { label: "Common", color: "#e8e2d2", frame: "/icons/weapons/backgrounds/white.png" },
  Blue: { label: "Rare", color: "#5aa8e6", frame: "/icons/weapons/backgrounds/blue.png" },
  Purple: { label: "Epic", color: "#b07ce8", frame: "/icons/weapons/backgrounds/purple.png" },
  Red: { label: "Legendary", color: "#e0584f", frame: "/icons/weapons/backgrounds/yellow.png" },
};

/** Deep-of-Night override: only the fields that change when DoN is toggled on. */
export interface ShopWeaponDeep {
  name?: string;
  rarity?: ShopRarity;
  price?: number;
  affinity?: string;
  skill?: string;
  passives?: string[];
  /** Curse / drawback applied in Deep of Night. */
  curse?: string;
}

/**
 * A weapon sold by a merchant — its NORMAL (standard) form. Passive values are
 * inline (e.g. "(+18%)"). In Deep of Night the `deep` override is layered on
 * top, which may add a curse, change the passive, or swap to a different item.
 */
export interface ShopWeapon {
  name: string;
  rarity: ShopRarity;
  price: number;
  affinity: string;
  skill: string;
  passives: string[];
  deep?: ShopWeaponDeep;
  /** Only sold by the Deep of Night merchant — hidden in the normal shop. */
  deepOnly?: boolean;
}

/** A weapon as displayed: its normal form, or merged with its Deep-of-Night override. */
export interface DisplayWeapon {
  name: string;
  rarity: ShopRarity;
  price: number;
  affinity: string;
  skill: string;
  passives: string[];
  curse?: string;
}
export function weaponForm(w: ShopWeapon, deepOfNight: boolean): DisplayWeapon {
  const base: DisplayWeapon = { name: w.name, rarity: w.rarity, price: w.price, affinity: w.affinity, skill: w.skill, passives: w.passives };
  return deepOfNight && w.deep ? { ...base, ...w.deep } : base;
}

/** A merchant's stock for a seed: weapons plus its crystal tears & aromatics. */
export interface Merchant {
  weapons: ShopWeapon[];
  tears: string[];
  aromatics: string[];
}

/**
 * A Legendary merchant weapon (Great Hollow only — a rarer occurrence). Shared
 * across a group of seeds; carries just a name, passive, and optional spell.
 */
export interface LegendaryItem {
  name: string;
  passive: string;
  spell?: string;
  /** Resolved icon path, when one exists on disk. */
  icon?: string;
}

/** One seed (1–21), with its Super (special), Normal, and Legendary merchants. */
export interface MerchantSet {
  /** Seed number 1–21. Used in the URL (/town-map/1) and shown as the seal. */
  id: number;
  special: Merchant;
  normal: Merchant;
  /** Great Hollow Legendary merchant stock (rarer; shown under the Normal merchant). */
  legendary: LegendaryItem[];
}

/**
 * The seed's representative weapon = the Purple weapon in the Normal merchant
 * (the seed's standout). In normal mode, Deep-of-Night-only items are excluded
 * (they aren't sold in the normal shop). Falls back to the last eligible weapon.
 */
export function getSetSignature(set: MerchantSet, deepOfNight = false): ShopWeapon | undefined {
  const pool = set.normal.weapons.filter((w) => deepOfNight || !w.deepOnly);
  if (pool.length === 0) return undefined;
  const rarityOf = (w: ShopWeapon) => (deepOfNight && w.deep?.rarity) || w.rarity;
  return pool.find((w) => rarityOf(w) === "Purple") ?? pool[pool.length - 1];
}
