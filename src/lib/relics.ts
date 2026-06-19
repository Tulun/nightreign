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
  | "starting-items"
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

/** Split "Wylder: foo" / "[Wylder] foo" into the Nightfarer name and the rest. */
export function splitCharacter(name: string): { character: string; rest: string } {
  const colon = name.match(/^([A-Za-z]+):\s*(.*)$/);
  if (colon) return { character: colon[1], rest: colon[2] };
  const bracket = name.match(/^\[([A-Za-z]+)\]\s*(.*)$/);
  if (bracket) return { character: bracket[1], rest: bracket[2] };
  return { character: name, rest: name };
}

/** Group character-prefixed effects under their Nightfarer, preserving input order. */
export function groupByCharacter<T extends { name: string }>(
  items: T[],
): { character: string; items: { item: T; rest: string }[] }[] {
  const order: string[] = [];
  const map = new Map<string, { item: T; rest: string }[]>();
  for (const it of items) {
    const { character, rest } = splitCharacter(it.name);
    if (!map.has(character)) {
      map.set(character, []);
      order.push(character);
    }
    map.get(character)!.push({ item: it, rest });
  }
  return order.map((character) => ({ character, items: map.get(character)! }));
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
  { key: "spell-school", label: "Spell School Boost", group: "skills", note: "Each increases its school's sorcery/incantation damage by +12%." },
  { key: "discover", label: "Dormant Power Discovery", group: "skills" },
  { key: "starting-items", label: "Starting Items", group: "skills", note: "Begin the expedition already holding the item." },
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
  { key: "hp-weapon", label: "HP Restoration by Weapon Type", group: "restoration", note: "Restores ~15 HP per hit with continuous attacks — same amount for every weapon type." },
  { key: "fp-weapon", label: "FP Restoration by Weapon Type", group: "restoration", note: "Restores ~2 FP per hit with continuous attacks — same amount for every weapon type." },
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

/**
 * Per-effect buff values, keyed by the base effect name shown in the list.
 * Tiered entries list values for each tier in order (+0 / +1 / +2, etc.).
 * Sourced from the community relic-values sheet.
 */
export const RELIC_VALUES: Record<string, string> = {
  // Attack Power
  "Physical Attack Up": "+4% / +5% / +6% physical damage",
  "Magic Attack Power Up": "+4.5% / +5.5% / +6.5% magic damage",
  "Fire Attack Power Up": "+4.5% / +5.5% / +6.5% fire damage",
  "Lightning Attack Power Up": "+4.5% / +5.5% / +6.5% lightning damage",
  "Holy Attack Power Up": "+4.5% / +5.5% / +6.5% holy damage",
  "Attack power increases after using grease items": "+10% physical for 30s (grease duration)",
  "Taking attacks improves attack power": "+15% for 10s after taking a hit (refreshes; not if blocked)",
  "Improved Initial Standard Attack": "+15% on the first light attack of a chain",
  "Improved Guard Counters": "+17% guard counter damage",
  "Improved Critical Hits": "+18% (+23% at +1) critical damage",
  "Improved Roar & Breath Attacks": "+15% roar / breath damage",
  "Attack power permanently increased for each evergaol prisoner defeated": "+5% per Evergaol boss (permanent)",
  "Attack power up after defeating a Night Invader": "+7% per Night Invader",
  "Improved Attack Power with 3+ [Weapon] Equipped": "+20% (+10% for bows)",
  "Improved [Weapon] Attack Power": "+9% (+6% for bows)",
  "Guard counter is given a boost based on current HP": "+ (current HP ÷ 20) flat per guard-counter hit",
  "Improved Stance-Breaking when Two-Handing": "+5% poise damage when two-handing",
  "Improved Stance-Breaking when Wielding Two Armaments": "+5% poise damage when powerstancing",
  // Attributes
  // Vigor/Mind/Endurance show the derived HP/FP/Stamina. Strength, Dexterity,
  // Intelligence, Faith & Arcane just grant their tier value (+1/+2/+3) to the
  // stat, which the tier badges already show — so no value line for those.
  Vigor: "+20 / +40 / +60 Max HP",
  Mind: "+5 / +10 / +15 Max FP",
  Endurance: "+2 / +4 / +6 Max Stamina",
  Poise: "−5% / −10% / −15% poise damage taken",
  "Character Skill Cooldown Reduction": "−5% / −7.5% / −10% skill cooldown",
  "Ultimate Art Gauge": "+5% / +7.5% / +10% passive gauge gain",
  // Unique — negations & resistances
  "Magic Damage Negation Up": "+10% magic negation",
  "Fire Damage Negation Up": "+10% fire negation",
  "Lightning Damage Negation Up": "+10% lightning negation",
  "Holy Damage Negation Up": "+10% holy negation",
  "Improved Physical Damage Negation": "+10% physical negation",
  "Improved Poison Resistance": "+75 poison resistance",
  "Improved Blood Loss Resistance": "+75 blood-loss resistance",
  "Improved Sleep Resistance": "+75 sleep resistance",
  "Improved Death Blight Resistance": "+75 death-blight resistance",
  "Improved Rot Resistance": "+75 rot resistance",
  "Improved Frost Resistance": "+75 frost resistance",
  "Improved Madness Resistance": "+75 madness resistance",
  "Improved Damage Negation at Low HP": "+16% negation when HP is below 40%",
  "Increased Maximum HP": "+100 Max HP",
  "Increased Maximum FP": "+25 Max FP",
  "Increased Maximum Stamina": "+10 Max Stamina",
  // Unique / Unrollable — misc
  "Improved Throwing Pot Damage": "+15% pot damage",
  "Improved Throwing Knife Damage": "+15% knife damage",
  "Improved Throwing Stone Damage": "+15% stone damage",
  "Improved Perfuming Arts": "+15% perfume damage",
  "Max FP permanently increased after releasing Sorcerer's Rise mechanism": "+18% Max FP per Sorcerer's Rise unlocked",
  "Max FP Up with 3+ Staves Equipped": "+50 Max FP",
  "Max FP Up with 3+ Sacred Seals Equipped": "+50 Max FP",
  "Max HP Up with 3+ Small Shields Equipped": "+200 Max HP",
  "Max HP Up with 3+ Medium Shields Equipped": "+200 Max HP",
  "Max HP Up with 3+ Greatshields Equipped": "+200 Max HP",
  "Critical Hits Earn Runes": "+600 runes on critical hits",
  "Increased rune acquisition for self and allies": "+3.5% rune gain for you & allies",
  "Rune discount for shop purchases while on expedition": "10% shop discount",
  "Huge rune discount for shop purchases while on expedition": "20% shop discount",
  "Treasure marked upon map": "Reveals hidden chest locations",
  "Flask Also Heals Allies": "Heals allies 50% of flask HP (radius) — currently buggy",
  "Improved Poise & Damage Negation When Knocked Back by Damage": "+20% negation & −20% poise damage for 20s",
  "Switching Weapons Boosts Attack Power": "+10% physical for 10s",
  "Switching Weapons Adds an Affinity Attack": "+12 random-element AP for 10s",
  "Boosts Attack Power of Added Affinity Attacks": "+10% to added elemental AP",
  "Poison & Rot in Vicinity Increases Attack Power": "+12% for 20s when poison/rot procs nearby",
  "Partial HP Restoration upon Post-Damage Attacks": "Strong heal-on-hit briefly after taking damage",
  "Slowly restore HP for self and nearby allies when HP is low": "+0.5% max HP + 1 HP/s for 50s below 20% HP",
  "HP restored when using cured meats, medicinal boluses, etc.": "+50 HP on consumption",
  "Art gauge charged from successful guarding": "+1 Ultimate gauge on block",
  "Art gauge fills moderately upon critical hit": "+5 Ultimate gauge on crit",
  "Defeating enemies fills more of the Art gauge": "+5 Ultimate gauge per kill",
  "Critical Hit Boosts Stamina Recovery Speed": "+10 stamina/s for 15s",
  "HP Recovery From Successful Guarding": "+8 HP on block",
  "FP Restoration upon Successive Attacks": "+5% Max FP on continuous attacks",
  "HP Restoration upon Thrusting Counterattack": "+2.5% Max HP on counterhits",
  // Character — Wylder
  "Wylder: Art gauge greatly filled when ability is activated": "+18 skill gauge",
  "Wylder: Art activation spreads fire in area": "Ultimate leaves a fire DoT area",
  "Wylder: Follow-up attacks possible when using Character Skill (greatsword only)": "Light-attack follow-up after Claw Shot; +12 fire AP",
  // Character — Guardian
  "Guardian: Increased duration for Character Skill": "Charge for a bigger, longer tornado that blocks projectiles",
  "Guardian: Slowly restores nearby allies' HP while Art is active": "Allies heal 10% max HP + 12 per 0.5s while held",
  "Guardian: Creates whirlwind when charging halberd attacks": "Whirlwind after a halberd charged heavy",
  // Character — Ironeye
  "Ironeye: Art Charge Activation Adds Poison Effect": "Charged ultimate deals 300 poison buildup",
  "Ironeye: Boosts thrusting counterattacks after executing Art": "+20% counterhit damage for 30s",
  "Ironeye: Extends duration of weak point": "Weak point lasts 22s (from 17.5s)",
  // Character — Duchess
  "Duchess: Dagger chain attack reprises event upon nearby enemies": "Extra DoT after a full light chain (~36–39% of its damage)",
  "Duchess: Defeating enemies while Art is active ups attack power": "+15% damage for 30s per kill during Ultimate",
  "Duchess: Improved Character Skill Attack Power": "Restage deals 60% of total damage (was 50%) — ~+20%",
  "Duchess: Become difficult to spot and silence footsteps after landing critical from behind": "Stealth & silent footsteps after a backstab crit",
  // Character — Raider
  "Raider: Improved Poise Near Totem Stela": "Incoming poise damage ×0.1 near the Totem Stela",
  "Raider: Defeating enemies near Totem Stela restores HP": "Restore 50% max HP per kill near the Totem Stela",
  "Raider: Damage taken while using Character Skill improves attack power and stamina": "+10% damage and +20% max stamina for 20s",
  "Raider: Duration of Ultimate Art extended": "Ultimate lasts 30s (from 20s)",
  // Character — Revenant
  "Revenant: Expend own HP to fully heal nearby allies when activating Art": "Spend 50% current HP on Art to fully heal allies",
  "Revenant: Trigger ghostflame explosion during Ultimate Art activation": "Ghostflame explosion on ultimate; 20 base magic",
  "Revenant: Strengthens family and allies when Ultimate Art is activated": "+25% ally damage for 30s",
  "Revenant: Power up while fighting alongside family": "Helen +1 HP/s · Frederick +1.1x damage · Sebastian +20% elemental negation",
  // Character — Recluse
  "Recluse: Collecting affinity residue activates Terra Magica": "Sigil grants +15% magic damage inside it for 30s",
  "Recluse: Suffer blood loss and increase attack power upon Art activation": "Ultimate self-damages 20% max HP; +16% damage for 30s",
  "Recluse: Activating Ultimate Art raises Max HP": "+50% max HP for 30s (stays until hit)",
  // Character — Executor
  "Executor: Character Skill Boosts Attack but Lowers Damage Negation While Attacking": "+35% damage for 6s; −40% negation for 5s",
  "Executor: While Character Skill is active, unlocking use of cursed sword restores HP": "Restores 5% max HP + 100",
  "Executor: Roaring restores HP while Art is active": "Restores 15% max HP after the roar during ultimate",
  // Character — Scholar
  "Scholar: Prevents Slowing of Character Skill Progress": "Slows decay of the Analyze meter",
  "Scholar: Allies Targeted by Character Skill Gain Boosted Attack": "Targeted allies +20% physical / +15% elemental for 30s",
  "Scholar: Continuous Damage Inflicted on Targets Threaded by Ultimate Art": "Threaded enemies take 15 dps for 20s",
  "Scholar: Earn Runes for Each Additional Specimen Acquired with Character Skill": "+1,300 runes per new enemy type analyzed",
  // Character — Undertaker
  "Undertaker: Activating Ultimate Art Increases Attack Power": "+18% damage for 40s after ultimate",
  "Undertaker: Attack Power Increased by Landing Chain Attack": "+16% damage for 20s after a chain's final hit",
  "Undertaker: Physical Attacks Boosted while Assist Effect from Incantation is Active for Self": "+19% physical for 60s after an incantation buff",
  "Undertaker: Contact with Allies Restores their HP while Ultimate Art is Activated": "Allies heal 30% max HP + 100 on contact with the ultimate",
};

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
