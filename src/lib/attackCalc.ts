// ─────────────────────────────────────────────────────────────────────────
//  Attack calculator. You enter the weapon's Attack Rating (AR) from the
//  Sparring Grounds dummy (which already bakes in stats, level and scaling),
//  set the damage-type % split, and stack buffs. Every buff is a SEPARATE
//  multiplier — they multiply together, not add. For split damage, the buff
//  multiplier is weighted by each type's share. All added buffs are assumed
//  active at their maximum value (matching the reference calculator).
// ─────────────────────────────────────────────────────────────────────────

export const DMG_TYPES = ["physical", "magic", "fire", "lightning", "holy"] as const;
export type DmgType = (typeof DMG_TYPES)[number];

export const DMG_LABELS: Record<DmgType, string> = {
  physical: "Physical", magic: "Magic", fire: "Fire", lightning: "Lightning", holy: "Holy",
};

export const ATK_ELEMENTS: DmgType[] = ["magic", "fire", "lightning", "holy"];

export type AtkScope = "all" | "physical" | "element";
export type AtkSource = "relic" | "weapon" | "talisman" | "custom";
export type StackKind = "yes" | "no";

export interface AttackEffect {
  id: string;
  label: string;
  source: AtkSource;
  group: string;
  scope: AtkScope;
  /** Buff value in % (e.g. 12 = ×1.12). */
  value: number;
  /** Scope "element" + player picks which element. */
  needsElement?: boolean;
  /** Scope "element" with a baked-in element (e.g. Scorpion charms). */
  element?: DmgType;
  /** Only applies to critical hits (backstab / riposte). */
  critOnly?: boolean;
  /** "yes" = every copy stacks; "no" = one copy counts. */
  stack: StackKind;
  /** Informational context (shown in the buffs table). */
  condition?: string;
}

export const ATTACK_EFFECTS: AttackEffect[] = [
  // ── Relic attack-ups (stack with every copy) ──
  { id: "r-phys0", label: "Physical Attack Up", source: "relic", group: "Physical Attack", scope: "physical", value: 4, stack: "yes" },
  { id: "r-phys1", label: "Physical Attack Up +1", source: "relic", group: "Physical Attack", scope: "physical", value: 5, stack: "yes" },
  { id: "r-phys2", label: "Physical Attack Up +2", source: "relic", group: "Physical Attack", scope: "physical", value: 6, stack: "yes" },
  { id: "r-phys3", label: "Physical Attack Up +3", source: "relic", group: "Physical Attack", scope: "physical", value: 8.5, stack: "yes" },
  { id: "r-phys4", label: "Physical Attack Up +4", source: "relic", group: "Physical Attack", scope: "physical", value: 12, stack: "yes" },
  { id: "r-elem0", label: "[Element] Attack Up", source: "relic", group: "Elemental Attack", scope: "element", value: 4, needsElement: true, stack: "yes" },
  { id: "r-elem1", label: "[Element] Attack Up +1", source: "relic", group: "Elemental Attack", scope: "element", value: 5, needsElement: true, stack: "yes" },
  { id: "r-elem2", label: "[Element] Attack Up +2", source: "relic", group: "Elemental Attack", scope: "element", value: 6, needsElement: true, stack: "yes" },
  { id: "r-elem3", label: "[Element] Attack Up +3", source: "relic", group: "Elemental Attack", scope: "element", value: 8.5, needsElement: true, stack: "yes" },
  { id: "r-elem4", label: "[Element] Attack Up +4", source: "relic", group: "Elemental Attack", scope: "element", value: 12, needsElement: true, stack: "yes" },

  // ── Weapon passives (same name + value = one copy) ──
  { id: "w-melee1", label: "Improved Melee Attack Power +1", source: "weapon", group: "General", scope: "all", value: 9, stack: "no" },
  { id: "w-melee2", label: "Improved Melee Attack Power +2", source: "weapon", group: "General", scope: "all", value: 12, stack: "no" },
  { id: "w-melee3", label: "Improved Melee Attack Power +3", source: "weapon", group: "General", scope: "all", value: 15, stack: "no" },
  { id: "w-elem1", label: "Improved [Element] Attack Power +1", source: "weapon", group: "Elemental", scope: "element", value: 6, needsElement: true, stack: "no" },
  { id: "w-elem2", label: "Improved [Element] Attack Power +2", source: "weapon", group: "Elemental", scope: "element", value: 9, needsElement: true, stack: "no" },
  { id: "w-elem3", label: "Improved [Element] Attack Power +3", source: "weapon", group: "Elemental", scope: "element", value: 12, needsElement: true, stack: "no" },
  { id: "w-2h1", label: "Attack Up When Two-Handing +1", source: "weapon", group: "Conditional", scope: "all", value: 12, stack: "no", condition: "Two-handing (not bows)" },
  { id: "w-2h2", label: "Attack Up When Two-Handing +2", source: "weapon", group: "Conditional", scope: "all", value: 15, stack: "no", condition: "Two-handing (not bows)" },
  { id: "w-2h3", label: "Attack Up When Two-Handing +3", source: "weapon", group: "Conditional", scope: "all", value: 18, stack: "no", condition: "Two-handing (not bows)" },
  { id: "w-low1", label: "Attack Power at Low HP +1", source: "weapon", group: "Conditional", scope: "all", value: 7, stack: "no", condition: "Below 20% HP" },
  { id: "w-low2", label: "Attack Power at Low HP +2", source: "weapon", group: "Conditional", scope: "all", value: 10, stack: "no", condition: "Below 20% HP" },
  { id: "w-low3", label: "Attack Power at Low HP +3", source: "weapon", group: "Conditional", scope: "all", value: 13, stack: "no", condition: "Below 20% HP" },
  { id: "w-low4", label: "Attack Power at Low HP +4", source: "weapon", group: "Conditional", scope: "all", value: 17, stack: "no", condition: "Below 20% HP" },
  { id: "w-low5", label: "Attack Power at Low HP +5", source: "weapon", group: "Conditional", scope: "all", value: 21, stack: "no", condition: "Below 20% HP" },
  { id: "w-full1", label: "Attack Power at Full HP +1", source: "weapon", group: "Conditional", scope: "all", value: 7, stack: "no", condition: "At 100% HP" },
  { id: "w-full2", label: "Attack Power at Full HP +2", source: "weapon", group: "Conditional", scope: "all", value: 10.5, stack: "no", condition: "At 100% HP" },
  { id: "w-full3", label: "Attack Power at Full HP +3", source: "weapon", group: "Conditional", scope: "all", value: 14, stack: "no", condition: "At 100% HP" },
  { id: "w-charge1", label: "Improved Charged Attacks +1", source: "weapon", group: "Attack Type", scope: "all", value: 16, stack: "no", condition: "Charged attacks" },
  { id: "w-charge2", label: "Improved Charged Attacks +2", source: "weapon", group: "Attack Type", scope: "all", value: 19, stack: "no", condition: "Charged attacks" },
  { id: "w-charge3", label: "Improved Charged Attacks +3", source: "weapon", group: "Attack Type", scope: "all", value: 22, stack: "no", condition: "Charged attacks" },
  { id: "w-jump1", label: "Improved Jump Attacks +1", source: "weapon", group: "Attack Type", scope: "all", value: 14, stack: "no", condition: "Jump attacks" },
  { id: "w-jump2", label: "Improved Jump Attacks +2", source: "weapon", group: "Attack Type", scope: "all", value: 17, stack: "no", condition: "Jump attacks" },
  { id: "w-jump3", label: "Improved Jump Attacks +3", source: "weapon", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Jump attacks" },
  { id: "w-dash1", label: "Improved Dash Attacks +1", source: "weapon", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Dash attacks" },
  { id: "w-dash2", label: "Improved Dash Attacks +2", source: "weapon", group: "Attack Type", scope: "all", value: 24, stack: "no", condition: "Dash attacks" },
  { id: "w-dash3", label: "Improved Dash Attacks +3", source: "weapon", group: "Attack Type", scope: "all", value: 28, stack: "no", condition: "Dash attacks" },
  { id: "w-roll1", label: "Improved Rolling Attacks +1", source: "weapon", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Rolling attacks" },
  { id: "w-roll2", label: "Improved Rolling Attacks +2", source: "weapon", group: "Attack Type", scope: "all", value: 24, stack: "no", condition: "Rolling attacks" },
  { id: "w-roll3", label: "Improved Rolling Attacks +3", source: "weapon", group: "Attack Type", scope: "all", value: 28, stack: "no", condition: "Rolling attacks" },
  { id: "w-chain1", label: "Improved Chain Attack Finishers +1", source: "weapon", group: "Attack Type", scope: "all", value: 21, stack: "no", condition: "Chain finisher" },
  { id: "w-chain2", label: "Improved Chain Attack Finishers +2", source: "weapon", group: "Attack Type", scope: "all", value: 26, stack: "no", condition: "Chain finisher" },
  { id: "w-chain3", label: "Improved Chain Attack Finishers +3", source: "weapon", group: "Attack Type", scope: "all", value: 31, stack: "no", condition: "Chain finisher" },
  { id: "w-guard1", label: "Improved Guard Counters +1", source: "weapon", group: "Attack Type", scope: "all", value: 17, stack: "no", condition: "Guard counter" },
  { id: "w-guard2", label: "Improved Guard Counters +2", source: "weapon", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Guard counter" },
  { id: "w-guard3", label: "Improved Guard Counters +3", source: "weapon", group: "Attack Type", scope: "all", value: 23, stack: "no", condition: "Guard counter" },
  { id: "w-ranged1", label: "Improved Ranged Weapon Attacks +1", source: "weapon", group: "Attack Type", scope: "all", value: 7, stack: "no", condition: "Ranged attacks" },
  { id: "w-ranged2", label: "Improved Ranged Weapon Attacks +2", source: "weapon", group: "Attack Type", scope: "all", value: 10, stack: "no", condition: "Ranged attacks" },
  { id: "w-ranged3", label: "Improved Ranged Weapon Attacks +3", source: "weapon", group: "Attack Type", scope: "all", value: 14, stack: "no", condition: "Ranged attacks" },
  { id: "w-skill1", label: "Improved Skill Attack Power +1", source: "weapon", group: "Skill & Spell", scope: "all", value: 15, stack: "no", condition: "Weapon skills" },
  { id: "w-skill2", label: "Improved Skill Attack Power +2", source: "weapon", group: "Skill & Spell", scope: "all", value: 18, stack: "no", condition: "Weapon skills" },
  { id: "w-skill3", label: "Improved Skill Attack Power +3", source: "weapon", group: "Skill & Spell", scope: "all", value: 21, stack: "no", condition: "Weapon skills" },
  { id: "w-spell1", label: "Improved Sorceries/Incantations +1", source: "weapon", group: "Skill & Spell", scope: "all", value: 5, stack: "no", condition: "Spells" },
  { id: "w-spell2", label: "Improved Sorceries/Incantations +2", source: "weapon", group: "Skill & Spell", scope: "all", value: 8, stack: "no", condition: "Spells" },
  { id: "w-spell3", label: "Improved Sorceries/Incantations +3", source: "weapon", group: "Skill & Spell", scope: "all", value: 11, stack: "no", condition: "Spells" },
  { id: "w-crit1", label: "Improved Critical Hits +1", source: "weapon", group: "Critical", scope: "all", value: 12, stack: "no", critOnly: true, condition: "Backstab / riposte" },
  { id: "w-crit2", label: "Improved Critical Hits +2", source: "weapon", group: "Critical", scope: "all", value: 18, stack: "no", critOnly: true, condition: "Backstab / riposte" },
  { id: "w-crit3", label: "Improved Critical Hits +3", source: "weapon", group: "Critical", scope: "all", value: 24, stack: "no", critOnly: true, condition: "Backstab / riposte" },

  // ── Damage talismans (one of each can be equipped) ──
  { id: "t-magicscorp", label: "Magic Scorpion Charm", source: "talisman", group: "Elemental", scope: "element", element: "magic", value: 15, stack: "no" },
  { id: "t-firescorp", label: "Fire Scorpion Charm", source: "talisman", group: "Elemental", scope: "element", element: "fire", value: 15, stack: "no" },
  { id: "t-boltscorp", label: "Lightning Scorpion Charm", source: "talisman", group: "Elemental", scope: "element", element: "lightning", value: 15, stack: "no" },
  { id: "t-sacredscorp", label: "Sacred Scorpion Charm", source: "talisman", group: "Elemental", scope: "element", element: "holy", value: 15, stack: "no" },
  { id: "t-kindred", label: "Kindred of Rot's Exultation", source: "talisman", group: "Conditional", scope: "all", value: 20, stack: "no", condition: "Poison/rot triggered nearby" },
  { id: "t-lordblood", label: "Lord of Blood's Exultation", source: "talisman", group: "Conditional", scope: "all", value: 20, stack: "no", condition: "Bleed triggered nearby" },
  { id: "t-millicent", label: "Millicent's Prosthesis", source: "talisman", group: "Conditional", scope: "all", value: 11, stack: "no", condition: "Successive attacks (max)" },
  { id: "t-wingedsword", label: "Winged Sword Insignia", source: "talisman", group: "Conditional", scope: "all", value: 10, stack: "no", condition: "Successive attacks (max)" },
  { id: "t-redfeather", label: "Red-Feathered Branchsword", source: "talisman", group: "Conditional", scope: "all", value: 20, stack: "no", condition: "Below 20% HP" },
  { id: "t-ritualsword", label: "Ritual Sword Talisman", source: "talisman", group: "Conditional", scope: "all", value: 10, stack: "no", condition: "At 100% HP" },
  { id: "t-arrowsting", label: "Arrow's Sting Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 14, stack: "no", condition: "Ranged attacks" },
  { id: "t-axe", label: "Axe Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 12, stack: "no", condition: "Charged attacks" },
  { id: "t-claw", label: "Claw Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 12, stack: "no", condition: "Jump attacks" },
  { id: "t-curved", label: "Curved Sword Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Guard counters" },
  { id: "t-spear", label: "Spear Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Thrust counterattacks" },
  { id: "t-twinblade", label: "Twinblade Talisman", source: "talisman", group: "Attack Type", scope: "all", value: 15, stack: "no", condition: "Chain finishers" },
  { id: "t-roar", label: "Roar Medallion", source: "talisman", group: "Attack Type", scope: "all", value: 20, stack: "no", condition: "Roar & breath attacks" },
  { id: "t-warriorjar", label: "Warrior Jar Shard", source: "talisman", group: "Skill & Spell", scope: "all", value: 15, stack: "no", condition: "Weapon skills" },
  { id: "t-faithful", label: "Faithful's Canvas Talisman", source: "talisman", group: "Skill & Spell", scope: "all", value: 11, stack: "no", condition: "Incantations" },
  { id: "t-graven", label: "Graven-School Talisman", source: "talisman", group: "Skill & Spell", scope: "all", value: 11, stack: "no", condition: "Sorceries" },
  { id: "t-godfrey", label: "Godfrey Icon", source: "talisman", group: "Skill & Spell", scope: "all", value: 18, stack: "no", condition: "Charged spells & skills" },
  { id: "t-dagger", label: "Dagger Talisman", source: "talisman", group: "Critical", scope: "all", value: 24, stack: "no", critOnly: true, condition: "Critical hits" },
];

export const ATTACK_EFFECT_MAP: Record<string, AttackEffect> = Object.fromEntries(ATTACK_EFFECTS.map((e) => [e.id, e]));

export interface AppliedAtk {
  scope: AtkScope;
  value: number;
  element?: DmgType;
  critOnly?: boolean;
}

function appliesTo(scope: AtkScope, type: DmgType, element?: DmgType): boolean {
  if (scope === "all") return true;
  if (scope === "physical") return type === "physical";
  return type === element;
}

/** Multiplier for one damage type. `crit` includes crit-only buffs. */
function typeMultiplier(type: DmgType, applied: AppliedAtk[], crit: boolean): number {
  let m = 1;
  for (const a of applied) {
    if (a.critOnly && !crit) continue;
    if (appliesTo(a.scope, type, a.element)) m *= 1 + a.value / 100;
  }
  return m;
}

/** Weighted multiplier across the damage-type split. */
export function weightedMultiplier(split: Record<DmgType, number>, applied: AppliedAtk[], crit = false): number {
  let total = 0;
  let shareSum = 0;
  for (const t of DMG_TYPES) {
    const share = split[t] || 0;
    shareSum += share;
    total += (share / 100) * typeMultiplier(t, applied, crit);
  }
  // Guard against a split that doesn't sum to 100 (renormalize).
  return shareSum > 0 ? total / (shareSum / 100) : 1;
}

export interface AttackResult {
  weightedR1: number;
  weightedCrit: number;
  r1: number;
  backstab: number;
  riposte: number;
}

export function computeAttack(
  ar: number,
  split: Record<DmgType, number>,
  applied: AppliedAtk[],
  opts: { backstabMult?: number; riposteMult?: number; rawBackstab?: number; rawRiposte?: number } = {},
): AttackResult {
  const { backstabMult = 1.6, riposteMult = 2.0, rawBackstab, rawRiposte } = opts;
  const wR1 = weightedMultiplier(split, applied, false);
  const wCrit = weightedMultiplier(split, applied, true);
  const bsBase = rawBackstab && rawBackstab > 0 ? rawBackstab : ar * backstabMult;
  const rpBase = rawRiposte && rawRiposte > 0 ? rawRiposte : ar * riposteMult;
  return {
    weightedR1: wR1,
    weightedCrit: wCrit,
    r1: ar * wR1,
    backstab: bsBase * wCrit,
    riposte: rpBase * wCrit,
  };
}
