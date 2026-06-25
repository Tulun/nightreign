import type { Tier } from "@/lib/tiers";

// Core data shapes for the reference app.

/** A single weapon entry sold by a merchant, with its passive. */
export interface WeaponEntry {
  /** Weapon name, e.g. "Envoy's Horn". */
  name: string;
  /** The weapon passive, e.g. "Multiple periodical glintblades". */
  passive: string;
  /** Source tier color: "common" (grey), "blue", or "purple". */
  tier: Tier;
  /** True if the entry was shown in yellow text in the source sheet. */
  highlighted?: boolean;
  /**
   * Per-entry icon override, e.g. "/icons/weapons/envoys-horn.png". Usually
   * leave this undefined: weapon art is mapped centrally by name in
   * src/data/weaponIcons.ts (so it's set once per weapon, not per row). Set
   * this only to override the registry for a single row.
   */
  icon?: string;
}

/**
 * One town map set (the screenshots are labelled "Set 0", "Set 1", ...).
 * Each set lists the Special Merchant and Normal Merchant inventories.
 */
export interface MerchantSet {
  /** 0–19. Used in the URL (/town-map/0) and shown as the seal number. */
  id: number;
  /** Items under the "Special Merchant" heading. */
  specialMerchant: WeaponEntry[];
  /** Items under the "Normal Merchant" heading. */
  normalMerchant: WeaponEntry[];
}

/**
 * The set's representative weapon = the LAST item in the Normal Merchant list
 * (per the source sheets). This is what the grid card icon + label use.
 */
export function getSetSignature(set: MerchantSet): WeaponEntry | undefined {
  return set.normalMerchant[set.normalMerchant.length - 1];
}
