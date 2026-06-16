// ─────────────────────────────────────────────────────────────────────────
//  Relic effects — the pool of effects a relic can roll, grouped by category.
//  Core rule: a relic can hold several effects, but NEVER two from the same
//  category. "unique" relics are the stackable exception; "unrollable" effects
//  only appear on fixed (found) relics and can't be rolled.
// ─────────────────────────────────────────────────────────────────────────

export type RelicCategory =
  | "attack"
  | "affinity"
  | "skill-swap"
  | "spell-swap"
  | "spell-school"
  | "discover"
  | "character"
  | "vigor"
  | "mind"
  | "endurance"
  | "strength"
  | "dexterity"
  | "intelligence"
  | "faith"
  | "arcane"
  | "cooldown"
  | "ult-gauge"
  | "poise"
  | "hp-weapon"
  | "fp-weapon"
  | "unique"
  | "unrollable";

export type RelicGroup =
  | "attack"
  | "skills"
  | "character"
  | "attributes"
  | "restoration"
  | "unique"
  | "unrollable";

export interface RelicEffect {
  name: string;
  category: RelicCategory;
  note?: string;
}

/** Canonical Nightfarer order, used to cluster character-specific effects. */
export const CHARACTER_ORDER = [
  "Wylder", "Guardian", "Ironeye", "Duchess", "Raider",
  "Revenant", "Recluse", "Executor", "Scholar", "Undertaker",
];

/** Index of the Nightfarer a "Wylder: …" / "[Wylder] …" effect belongs to (999 if none). */
export function characterIndex(name: string): number {
  const i = CHARACTER_ORDER.findIndex((c) => name.startsWith(`${c}:`) || name.startsWith(`[${c}]`));
  return i === -1 ? 999 : i;
}

export interface RelicCategoryMeta {
  key: RelicCategory;
  label: string;
  group: RelicGroup;
  /** Optional note shown under the category heading. */
  note?: string;
}

/** Shared note for the start-of-expedition armament swaps. */
const SWAP_NOTE =
  "Modifies a starting armament. The skill and spell swaps are mutually exclusive — a Nightfarer with both a weapon and a catalyst (e.g. Revenant) can only swap one of them.";

export const RELIC_CATEGORIES: RelicCategoryMeta[] = [
  { key: "attack", label: "Attack Power", group: "attack" },
  { key: "affinity", label: "Starting Armament Affinity", group: "skills" },
  { key: "skill-swap", label: "Starting Skill Swap", group: "skills", note: SWAP_NOTE },
  { key: "spell-swap", label: "Starting Spell Swap", group: "skills", note: SWAP_NOTE },
  { key: "spell-school", label: "Spell School Boost", group: "skills" },
  { key: "discover", label: "Dormant Power Discovery", group: "skills" },
  { key: "character", label: "Character Art & Skill", group: "character" },
  { key: "vigor", label: "Vigor", group: "attributes" },
  { key: "mind", label: "Mind", group: "attributes" },
  { key: "endurance", label: "Endurance", group: "attributes" },
  { key: "strength", label: "Strength", group: "attributes" },
  { key: "dexterity", label: "Dexterity", group: "attributes" },
  { key: "intelligence", label: "Intelligence", group: "attributes" },
  { key: "faith", label: "Faith", group: "attributes" },
  { key: "arcane", label: "Arcane", group: "attributes" },
  { key: "cooldown", label: "Character Skill Cooldown", group: "attributes" },
  { key: "ult-gauge", label: "Ultimate Art Gauge", group: "attributes" },
  { key: "poise", label: "Poise", group: "attributes" },
  { key: "hp-weapon", label: "HP Restoration by Weapon Type", group: "restoration" },
  { key: "fp-weapon", label: "FP Restoration by Weapon Type", group: "restoration" },
  { key: "unique", label: "Unique / Stackable", group: "unique", note: "Exempt from the rule — these can roll alongside any category, including each other." },
  { key: "unrollable", label: "Unrollable", group: "unrollable", note: "Only found on fixed relics — these can't be rolled onto a relic." },
];

export const RELIC_GROUPS: { key: RelicGroup; label: string }[] = [
  { key: "attack", label: "Attack" },
  { key: "skills", label: "Affinity & Skills" },
  { key: "character", label: "Character" },
  { key: "attributes", label: "Attributes" },
  { key: "restoration", label: "Restoration" },
  { key: "unique", label: "Unique" },
  { key: "unrollable", label: "Unrollable" },
];

export const RELIC_CREDIT = "Data from the community Nightreign relics sheet";

// ── Deep relics ─────────────────────────────────────────────────────────────
// Deep relics roll from a richer pool with full effect text, plus Character
// stat-swaps and Curse drawbacks. Stack uses the same kinds as weapon passives.
import type { StackKind } from "@/lib/weaponPassives";

export type DeepRelicCategory =
  | "stat"
  | "start"
  | "exploration"
  | "offensive"
  | "defensive"
  | "regen"
  | "character"
  | "curse";

export interface DeepRelic {
  name: string;
  effect: string;
  category: DeepRelicCategory;
  stack: StackKind;
  note?: string;
}

export const DEEP_RELIC_CATEGORIES: { key: DeepRelicCategory; label: string }[] = [
  { key: "stat", label: "Stat" },
  { key: "start", label: "Start of Game" },
  { key: "exploration", label: "Exploration" },
  { key: "offensive", label: "Offensive" },
  { key: "defensive", label: "Defensive" },
  { key: "regen", label: "Regen" },
  { key: "character", label: "Character" },
  { key: "curse", label: "Curse" },
];
