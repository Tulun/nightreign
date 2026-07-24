// ─────────────────────────────────────────────────────────────────────────
//  Nightfarers — the 10 playable characters and their base stats: HP/FP/
//  stamina, attributes, damage negations (%), status resistances, and poise.
// ─────────────────────────────────────────────────────────────────────────

export interface CharacterAttributes {
  vig: number; mnd: number; end: number; str: number; dex: number; int: number; fai: number; arc: number;
}

export interface CharacterNegations {
  physical: number; slash: number; strike: number; thrust: number;
  magic: number; fire: number; lightning: number; holy: number;
}

export interface CharacterResistances {
  poison: number; rot: number; bleed: number; frost: number; sleep: number; madness: number; blight: number;
}

export interface Nightfarer {
  name: string;
  hp: number;
  fp: number;
  stamina: number;
  poise: number;
  attributes: CharacterAttributes;
  /** Damage negations as percentages. */
  negations: CharacterNegations;
  /** Status resistance buildup thresholds. */
  resistances: CharacterResistances;
}

export const ATTRIBUTE_COLUMNS: { key: keyof CharacterAttributes; label: string }[] = [
  { key: "vig", label: "Vig" }, { key: "mnd", label: "Mnd" }, { key: "end", label: "End" }, { key: "str", label: "Str" },
  { key: "dex", label: "Dex" }, { key: "int", label: "Int" }, { key: "fai", label: "Fai" }, { key: "arc", label: "Arc" },
];

export const NEGATION_COLUMNS: { key: keyof CharacterNegations; label: string }[] = [
  { key: "physical", label: "Phys" }, { key: "slash", label: "Slash" }, { key: "strike", label: "Strike" },
  { key: "thrust", label: "Thrust" }, { key: "magic", label: "Magic" }, { key: "fire", label: "Fire" },
  { key: "lightning", label: "Lit" }, { key: "holy", label: "Holy" },
];

export const RESIST_COLUMNS: { key: keyof CharacterResistances; label: string; icon: string }[] = [
  { key: "poison", label: "Poison", icon: "/icons/status/poison.png" },
  { key: "rot", label: "Rot", icon: "/icons/status/rot.png" },
  { key: "bleed", label: "Bleed", icon: "/icons/status/bleed.png" },
  { key: "frost", label: "Frost", icon: "/icons/status/frost.png" },
  { key: "sleep", label: "Sleep", icon: "/icons/status/sleep.png" },
  { key: "madness", label: "Madness", icon: "/icons/status/madness.png" },
  { key: "blight", label: "Blight", icon: "/icons/status/deathblight.png" },
];

export const CHARACTER_CREDIT = "Base stats from the community Nightreign sheet";
