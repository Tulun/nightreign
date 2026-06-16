// ─────────────────────────────────────────────────────────────────────────
//  Weapon passives — the in-game passive effects that roll on weapons, whether
//  they stack with themselves, and notes. "Power of …" effects are grouped into
//  their own Unique category. Some effects only stack across DIFFERENT tiers
//  (e.g. a +1 and a +3 stack, two +2s don't) → the "tiers" stack kind.
// ─────────────────────────────────────────────────────────────────────────

export type PassiveCategory = "stat" | "offensive" | "defensive" | "regen" | "exploration" | "unique" | "curse";

export type StackKind = "yes" | "no" | "tiers" | "maybe" | "unknown";

export interface WeaponPassive {
  /** In-game effect name. */
  name: string;
  /** What it does, with per-tier values. */
  effect: string;
  category: PassiveCategory;
  stack: StackKind;
  note?: string;
}

export const PASSIVE_CATEGORIES: { key: PassiveCategory; label: string }[] = [
  { key: "stat", label: "Stat" },
  { key: "offensive", label: "Offensive" },
  { key: "defensive", label: "Defensive" },
  { key: "regen", label: "Regen" },
  { key: "exploration", label: "Exploration" },
  { key: "unique", label: "Unique" },
  { key: "curse", label: "Curse" },
];

export type PassivePool = "normal" | "deep";

export const STACK_META: Record<StackKind, { label: string; cls: string; legend: string }> = {
  yes: { label: "Stacks", cls: "border-emerald-500/50 text-emerald-300", legend: "stacks with itself" },
  tiers: { label: "Tiers only", cls: "border-amber-500/50 text-amber-300", legend: "only different tiers stack (e.g. +1 with +3, not +2 with +2)" },
  maybe: { label: "Likely", cls: "border-sky-500/50 text-sky-300", legend: "believed to stack (unconfirmed)" },
  no: { label: "No", cls: "border-night-600 text-parchment-faint", legend: "does not stack with itself" },
  unknown: { label: "—", cls: "border-night-700 text-parchment-faint", legend: "stacking unknown" },
};

export const WEAPON_PASSIVE_CREDIT = "Data from the community Nightreign weapon-passives sheet";
