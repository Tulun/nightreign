// ─────────────────────────────────────────────────────────────────────────
//  Damage-negation calculator. Base negations are the Lv15 character values.
//  Effects stack MULTIPLICATIVELY on the damage-taken side, so you can never
//  reach 100%: finalNeg = 1 − (1 − base) · Π(1 − effect). Curse penalties are
//  negative (they multiply damage UP). One copy per rarity tier is counted.
// ─────────────────────────────────────────────────────────────────────────

import type { CharacterNegations } from "@/lib/characters";

export const NEG_TYPES = ["physical", "slash", "strike", "thrust", "magic", "fire", "lightning", "holy"] as const;
export type NegType = (typeof NEG_TYPES)[number];

export const NEG_LABELS: Record<NegType, string> = {
  physical: "Standard", slash: "Slash", strike: "Strike", thrust: "Thrust/Pierce",
  magic: "Magic", fire: "Fire", lightning: "Lightning", holy: "Holy",
};

export const ELEMENTS: NegType[] = ["magic", "fire", "lightning", "holy"];
export const PHYSICAL_TYPES: NegType[] = ["physical", "slash", "strike", "thrust"];

export type Scope = "all" | "physical" | "affinity" | "element";

export function scopeLabel(scope: Scope, element?: NegType): string {
  switch (scope) {
    case "all": return "All types";
    case "physical": return "Physical";
    case "affinity": return "All elements";
    case "element": return element ? NEG_LABELS[element] : "Element";
  }
}

export type EffectSource = "relic" | "weapon" | "curse";

export interface NegEffect {
  id: string;
  label: string;
  source: EffectSource;
  /** Optgroup heading in the picker. */
  group: string;
  scope: Scope;
  /** Negation % (negative = curse penalty / increases damage). */
  value: number;
  /** Scope "element": the player chooses which element it applies to. */
  needsElement?: boolean;
  condition?: string;
  /** Only one copy counts even across relics. */
  noStack?: boolean;
}

export const NEG_EFFECTS: NegEffect[] = [
  // ── Relic effects (shown in relic slots) ──
  { id: "r-elem10", label: "[Element] Damage Negation Up", source: "relic", group: "Elemental", scope: "element", value: 10, needsElement: true },
  { id: "r-elem-d1", label: "Improved [Element] Damage Negation +1", source: "relic", group: "Elemental", scope: "element", value: 15, needsElement: true },
  { id: "r-elem-d2", label: "Improved [Element] Damage Negation +2", source: "relic", group: "Elemental", scope: "element", value: 16, needsElement: true },
  { id: "r-phys", label: "Improved Physical Damage Negation", source: "relic", group: "Physical", scope: "physical", value: 10 },
  { id: "r-phys-d1", label: "Improved Physical Damage Negation +1", source: "relic", group: "Physical", scope: "physical", value: 10.5 },
  { id: "r-phys-d2", label: "Improved Physical Damage Negation +2", source: "relic", group: "Physical", scope: "physical", value: 12 },
  { id: "r-aff0", label: "Improved Affinity Damage Negation +0", source: "relic", group: "Affinity", scope: "affinity", value: 6 },
  { id: "r-aff1", label: "Improved Affinity Damage Negation +1", source: "relic", group: "Affinity", scope: "affinity", value: 10.5 },
  { id: "r-aff2", label: "Improved Affinity Damage Negation +2", source: "relic", group: "Affinity", scope: "affinity", value: 12 },
  { id: "r-lowhp", label: "Improved Damage Negation at Low HP", source: "relic", group: "Conditional", scope: "all", value: 16, condition: "Below 40% HP" },
  { id: "r-knockback", label: "Improved Poise & Dmg Negation on Knockback", source: "relic", group: "Conditional", scope: "all", value: 20, condition: "After knockback", noStack: true },

  // ── Weapon passives (shown in the weapon-passive section) ──
  { id: "w-elem1", label: "Improved [Element] Damage Negation +1", source: "weapon", group: "Elemental", scope: "element", value: 12, needsElement: true },
  { id: "w-elem2", label: "Improved [Element] Damage Negation +2", source: "weapon", group: "Elemental", scope: "element", value: 16, needsElement: true },
  { id: "w-elem3", label: "Improved [Element] Damage Negation +3", source: "weapon", group: "Elemental", scope: "element", value: 20, needsElement: true },
  { id: "w-lowhp1", label: "Damage Negation at Low HP +1", source: "weapon", group: "Conditional", scope: "all", value: 23, condition: "Below 40% HP" },
  { id: "w-lowhp2", label: "Damage Negation at Low HP +2", source: "weapon", group: "Conditional", scope: "all", value: 30, condition: "Below 40% HP" },
  { id: "w-lowhp3", label: "Damage Negation at Low HP +3", source: "weapon", group: "Conditional", scope: "all", value: 37, condition: "Below 40% HP" },
  { id: "w-fullhp1", label: "Damage Negation at Full HP +1", source: "weapon", group: "Conditional", scope: "all", value: 24, condition: "At 100% HP" },
  { id: "w-fullhp2", label: "Damage Negation at Full HP +2", source: "weapon", group: "Conditional", scope: "all", value: 32, condition: "At 100% HP" },
  { id: "w-fullhp3", label: "Damage Negation at Full HP +3", source: "weapon", group: "Conditional", scope: "all", value: 40, condition: "At 100% HP" },
  { id: "w-take1", label: "Taking Damage Boosts Negation +1", source: "weapon", group: "Conditional", scope: "all", value: 21, condition: "After taking damage" },
  { id: "w-take2", label: "Taking Damage Boosts Negation +2", source: "weapon", group: "Conditional", scope: "all", value: 28, condition: "After taking damage" },
  { id: "w-take3", label: "Taking Damage Boosts Negation +3", source: "weapon", group: "Conditional", scope: "all", value: 36, condition: "After taking damage" },
  { id: "w-cast1", label: "Negation While Casting +1", source: "weapon", group: "Conditional", scope: "all", value: 18, condition: "While casting" },
  { id: "w-cast2", label: "Negation While Casting +2", source: "weapon", group: "Conditional", scope: "all", value: 24, condition: "While casting" },
  { id: "w-cast3", label: "Negation While Casting +3", source: "weapon", group: "Conditional", scope: "all", value: 30, condition: "While casting" },
  { id: "w-charge1", label: "Negation upon Charge Attacks +1", source: "weapon", group: "Conditional", scope: "all", value: 24, condition: "After charge attack" },
  { id: "w-charge2", label: "Negation upon Charge Attacks +2", source: "weapon", group: "Conditional", scope: "all", value: 32, condition: "After charge attack" },
  { id: "w-charge3", label: "Negation upon Charge Attacks +3", source: "weapon", group: "Conditional", scope: "all", value: 40, condition: "After charge attack" },
  { id: "w-succ1", label: "Successive Attacks Negate Damage +1", source: "weapon", group: "Conditional", scope: "all", value: 38, condition: "Successive attacks" },
  { id: "w-succ2", label: "Successive Attacks Negate Damage +2", source: "weapon", group: "Conditional", scope: "all", value: 48, condition: "Successive attacks" },
  { id: "w-succ3", label: "Successive Attacks Negate Damage +3", source: "weapon", group: "Conditional", scope: "all", value: 60, condition: "Successive attacks" },
  { id: "w-guard1", label: "Successful Guarding Ups Negation +1", source: "weapon", group: "Conditional", scope: "all", value: 14, condition: "After guarding" },
  { id: "w-guard2", label: "Successful Guarding Ups Negation +2", source: "weapon", group: "Conditional", scope: "all", value: 19, condition: "After guarding" },
  { id: "w-guard3", label: "Successful Guarding Ups Negation +3", source: "weapon", group: "Conditional", scope: "all", value: 24, condition: "After guarding" },

  // ── Curse penalties (negative; shown via "+ Curse Penalty") ──
  { id: "c-phys1", label: "Impaired Physical Damage Negation +1", source: "curse", group: "Curse", scope: "physical", value: -5.5 },
  { id: "c-phys2", label: "Impaired Physical Damage Negation +2", source: "curse", group: "Curse", scope: "physical", value: -8 },
  { id: "c-aff1", label: "Impaired Affinity Damage Negation +1", source: "curse", group: "Curse", scope: "affinity", value: -5.5 },
  { id: "c-aff2", label: "Impaired Affinity Damage Negation +2", source: "curse", group: "Curse", scope: "affinity", value: -8 },
  { id: "c-evade", label: "More Damage Taken After Evasion", source: "curse", group: "Curse", scope: "all", value: -45, condition: "Right after rolling" },
  { id: "c-repeat", label: "Repeated Evasions Lower Negation", source: "curse", group: "Curse", scope: "all", value: -35, condition: "On repeated rolls" },
  { id: "c-flask", label: "Reduced Negation for Flask Usages", source: "curse", group: "Curse", scope: "all", value: -45, condition: "While using a flask" },
  { id: "c-stam", label: "Low Stamina Impairs Negation", source: "curse", group: "Curse", scope: "all", value: -15, condition: "Stamina ≤ 50%" },
];

export const NEG_EFFECT_MAP: Record<string, NegEffect> = Object.fromEntries(NEG_EFFECTS.map((e) => [e.id, e]));

export interface AppliedNeg {
  scope: Scope;
  value: number;
  element?: NegType;
}

function appliesToType(scope: Scope, type: NegType, element?: NegType): boolean {
  switch (scope) {
    case "all": return true;
    case "physical": return PHYSICAL_TYPES.includes(type);
    case "affinity": return ELEMENTS.includes(type);
    case "element": return type === element;
  }
}

/** Final negation % per damage type, stacking multiplicatively. */
export function computeNegations(base: CharacterNegations, applied: AppliedNeg[]): Record<NegType, number> {
  const out = {} as Record<NegType, number>;
  for (const type of NEG_TYPES) {
    let dmgTaken = 1 - base[type] / 100;
    for (const a of applied) {
      if (appliesToType(a.scope, type, a.element)) dmgTaken *= 1 - a.value / 100;
    }
    out[type] = (1 - dmgTaken) * 100;
  }
  return out;
}
