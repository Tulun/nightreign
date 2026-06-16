import type { WeaponPassive } from "@/lib/weaponPassives";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  WEAPON PASSIVES
 * ─────────────────────────────────────────────────────────────────────────
 *  From the community passives sheet. "Power of …" effects are reclassified
 *  into the Unique category. "tiers" stack = only different tiers stack.
 */
export const weaponPassives: WeaponPassive[] = [
  // ── Stat ────────────────────────────────────────────────────────────────
  { name: "The Wylder's Grief +1/2/3", effect: "Increases strength & dexterity by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Guardian's Grief +1/2/3", effect: "Increases vigor & endurance by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Ironeye's Grief +1/2/3", effect: "Increases endurance & dexterity by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Duchess' Grief +1/2/3", effect: "Increases dexterity & intelligence by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Raider's Grief +1/2/3", effect: "Increases vigor & strength by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Revenant's Grief +1/2/3", effect: "Increases faith & arcane by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Recluse's Grief +1/2/3", effect: "Increases mind & intelligence by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Executor's Grief +1/2/3", effect: "Increases dexterity & arcane by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Scholar's Grief +1/2/3", effect: "Increases intelligence & arcane by 3 / 6 / 9", category: "stat", stack: "no" },
  { name: "The Undertaker's Grief +1/2/3", effect: "Increases strength & faith by 3 / 6 / 9", category: "stat", stack: "no" },

  // ── Exploration ───────────────────────────────────────────────────────────
  { name: "Improved Item Discovery", effect: "Increases discovery by 20 / 30 / 40", category: "exploration", stack: "yes" },

  // ── Offensive ─────────────────────────────────────────────────────────────
  { name: "Attack Up When Wielding Two Armaments", effect: "Increases paired L1 damage by 1.12x / 1.15x / 1.18x", category: "offensive", stack: "yes" },
  { name: "Improved Attack Power When Two-Handing", effect: "Increases damage by 1.12x / 1.15x / 1.18x when two-handing", category: "offensive", stack: "yes", note: "Does not apply to bows." },
  { name: "Improved Attack Power at Low HP", effect: "Increases damage by 1.07x / 1.1x / 1.13x / 1.17x / 1.21x when HP is below 20%", category: "offensive", stack: "yes" },
  { name: "Improved Attack Power at Full HP", effect: "Increases damage by 1.07x / 1.105x / 1.14x when HP is at 100%", category: "offensive", stack: "yes" },
  { name: "Improved Melee Attack Power", effect: "Increases melee attack power by 1.09x / 1.12x / 1.15x", category: "offensive", stack: "yes" },
  { name: "Improved Chain Attack Finishers", effect: "Increases the last hit of a light-attack chain by 1.21x / 1.26x / 1.31x", category: "offensive", stack: "yes" },
  { name: "Improved Charged Attacks", effect: "Increases charged heavy damage by 1.16x / 1.19x / 1.22x", category: "offensive", stack: "yes" },
  { name: "Improved Skill Attack Power", effect: "Increases skill damage by 1.15x / 1.18x / 1.21x", category: "offensive", stack: "yes", note: "Includes charged skills. Does not affect character skills." },
  { name: "Improved Dash Attacks", effect: "Increases running attack damage by 1.2x / 1.24x / 1.28x", category: "offensive", stack: "yes" },
  { name: "Improved Rolling Attacks", effect: "Increases rolling attack damage by 1.2x / 1.24x / 1.28x", category: "offensive", stack: "yes" },
  { name: "Improved Guard Counters", effect: "Increases guard counter damage by 1.17x / 1.20x / 1.23x", category: "offensive", stack: "yes" },
  { name: "Improved Jump Attacks", effect: "Increases jump attack damage by 1.14x / 1.17x / 1.20x", category: "offensive", stack: "yes", note: "Does not include ashes like Lion's Claw." },
  { name: "Improved Critical Hits", effect: "Increases critical hit damage by 1.12x / 1.18x / 1.24x", category: "offensive", stack: "yes" },
  { name: "Improved Ranged Weapon Attacks", effect: "Increases ranged damage by 1.07x / 1.1x / 1.14x", category: "offensive", stack: "yes" },
  { name: "Improved Magic/Fire/Lightning/Holy Attack Power", effect: "Increases damage of the respective element by 1.06x / 1.09x / 1.12x", category: "offensive", stack: "yes" },
  { name: "Add Magic/Fire/Holy/Lightning to Weapon", effect: "Moves 25 / 26 / 30 / 35 physical AP to that element's AP", category: "offensive", stack: "no", note: "Does not affect scaling." },
  { name: "Attacks Inflict Poison/Blood Loss/Sleep/Rot/Frost", effect: "Adds 18 / 23 / 30 status buildup to the weapon", category: "offensive", stack: "no" },
  { name: "[Affinity] Attack Follows Charge Attacks that Land", effect: "Deals extra magic/fire/lightning/holy damage after a landed charge attack. 75 base attack", category: "offensive", stack: "no" },
  { name: "Attacks Generate Golden Shockwave", effect: "Creates a golden shockwave on successive attacks. 420 base attack, 16.8 poise damage", category: "offensive", stack: "no" },
  { name: "Attacks Generate Lava", effect: "Creates a lava pool on successive attacks. 325 base fire attack, lasts ~1.5s", category: "offensive", stack: "no" },
  { name: "Attacks Generate Mist of Charm", effect: "Creates a charm cloud on successive attacks, lasts ~1s", category: "offensive", stack: "no" },
  { name: "Attacks Call Vengeful Spirits", effect: "Summons spirits on successive attacks. 282 base magic damage, 10 poise damage", category: "offensive", stack: "no" },
  { name: "Attacks Release Mist of Frost", effect: "Successive attacks create a frost mist; 9 frost, ticks 5/s for 16s (80 total ticks)", category: "offensive", stack: "no" },
  { name: "Attacks Unleash Lightning", effect: "Creates lightning on successive attacks. 246 base lightning attack, 5 poise damage", category: "offensive", stack: "no" },
  { name: "Improved Sorceries/Incantations", effect: "Increases sorcery/incantation damage by 1.05x / 1.08x / 1.11x", category: "offensive", stack: "yes" },
  { name: "Improved Charged Sorceries/Incantations", effect: "Increases charged sorcery/incantation damage by 1.09x / 1.13x / 1.18x", category: "offensive", stack: "yes" },
  { name: "Improved Spell Casting Speed", effect: "Increases virtual Dex by 30 / 60", category: "offensive", stack: "yes" },
  { name: "Projectile Damage Drop-off Reduced", effect: "Reduces ranged projectile damage falloff over distance", category: "offensive", stack: "unknown" },
  { name: "Reduced Skill FP Cost", effect: "Reduces skill FP cost by 0.88x / 0.82x / 0.76x", category: "offensive", stack: "yes" },
  { name: "Reduced Spell FP Cost", effect: "Reduces sorcery & incantation FP cost by 0.9x / 0.85x / 0.8x", category: "offensive", stack: "yes" },
  { name: "Extended Spell Duration", effect: "Increases spell duration by 100%", category: "offensive", stack: "yes" },
  { name: "Multiple Periodical Glintblades", effect: "Creates 5 glintblades every 18s. 60 magic attack, 1 poise damage each", category: "offensive", stack: "no", note: "Not affected by the Glintblade sorcery buff." },
  { name: "Many Periodical Glintblades", effect: "Creates 9 glintblades every 18s. 48 magic attack, 1 poise damage each", category: "offensive", stack: "no", note: "Not affected by the Glintblade sorcery buff." },
  { name: "Improved Stance-Breaking when Two-Handing", effect: "Increases poise damage by 1.2x / 1.25x when two-handing", category: "offensive", stack: "yes" },
  { name: "Improved Stance-Breaking when Wielding Two Armaments", effect: "Increases paired L1 poise damage by 1.2x / 1.25x", category: "offensive", stack: "yes" },
  { name: "Improved Guard Breaking", effect: "Increases stamina damage by 1.3x / 1.45x / 1.6x", category: "offensive", stack: "yes" },

  // ── Defensive ─────────────────────────────────────────────────────────────
  { name: "Improved Magic/Fire/Lightning/Holy Damage Negation", effect: "Increases the respective element's damage negation by 12% / 16% / 20%", category: "defensive", stack: "yes" },
  { name: "Improved Damage Negation at Low HP", effect: "Increases damage negation by 23% / 30% / 37% when HP is below 40%", category: "defensive", stack: "yes" },
  { name: "Improved Damage Negation at Full HP", effect: "Increases damage negation by 24% / 32% / 40% when HP is at 100%", category: "defensive", stack: "yes" },
  { name: "Taking Damage Boosts Damage Negation", effect: "Increases damage negation by 21% / 28% / 36% for 10s after taking damage", category: "defensive", stack: "tiers" },
  { name: "Damage Negation Up While Casting Spells", effect: "Increases damage negation by 18% / 24% / 30% during a casting animation", category: "defensive", stack: "tiers" },
  { name: "Damage Negation Up upon Landing Charge Attacks", effect: "Increases damage negation by 24% / 32% / 40% after a landed charged heavy", category: "defensive", stack: "tiers" },
  { name: "Successive Attacks Negate Damage", effect: "Increases damage negation by 38% / 48% / 60% with continuous attacks. Lasts 30s or until hit", category: "defensive", stack: "tiers", note: "Bows cannot trigger; most spells cannot trigger. The more copies you stack, the harder it is to proc." },
  { name: "Successful Guarding Ups Damage Negation", effect: "Increases damage negation by 14% / 19% / 24% after blocking an attack", category: "defensive", stack: "tiers" },
  { name: "Successful Guarding Ups Poise", effect: "Reduces incoming poise damage by 0.88x / 0.82x / 0.76x after blocking", category: "defensive", stack: "yes" },
  { name: "Improved Guarding Ability", effect: "Reduces stamina damage taken when guarding by 0.9x / 0.85x / 0.8x", category: "defensive", stack: "yes" },
  { name: "Improved Poison/Blood Loss/Sleep/Deathblight/Rot/Frost/Madness Resist", effect: "Increases the respective status resistance by 57 / 75 / 112", category: "defensive", stack: "yes" },
  { name: "Less Likely to Be Targeted", effect: "Decreases target priority by 300 / 450 / 600", category: "defensive", stack: "yes" },

  // ── Regen ───────────────────────────────────────────────────────────────
  { name: "Continuous HP Recovery", effect: "Recovers 1 HP/s", category: "regen", stack: "yes" },
  { name: "HP Restoration upon Landing Attacks", effect: "Restores 4 / 6 / 8 HP on continuous attacks", category: "regen", stack: "maybe" },
  { name: "FP Restoration upon Landing Attacks", effect: "Restores 1 / 2 / 3 FP on continuous attacks", category: "regen", stack: "maybe" },
  { name: "Defeating Enemies Restores HP", effect: "Restores 20 / 30 / 40 HP on enemy kill", category: "regen", stack: "yes" },
  { name: "Defeating Enemies Restores FP", effect: "Restores 4% / 6% / 8% of max FP on enemy kill", category: "regen", stack: "no" },
  { name: "Taking Damage Restores FP", effect: "Recovers 2 / 4 / 6 FP after taking damage", category: "regen", stack: "no" },
  { name: "Critical Hit FP Restoration", effect: "Restores 10% of max FP on critical hits", category: "regen", stack: "no" },

  // ── Unique (Power of …) ───────────────────────────────────────────────────
  { name: "Power of Night and Flame", effect: "Adds 67 magic or fire AP for 30s depending on the stance used", category: "unique", stack: "no" },
  { name: "Power of House Marais", effect: "+1.1% damage per stack to 30 stacks, +0.85% to 50, +0.4% to 100 (cap +70% damage)", category: "unique", stack: "no", note: "Stacks additively." },
  { name: "Power of Destined Death", effect: "Deals (Max HP × 1%) + 2 damage every 0.1s for 0.8s (8 ticks) on each attack", category: "unique", stack: "yes" },
  { name: "Power of the Blood Lord", effect: "Increases damage by 1.3x for 20s when bleed is triggered within 7m", category: "unique", stack: "no" },
  { name: "Power of the Great Ancient Dragon", effect: "Adds 67 lightning AP for 30s after using a charged skill", category: "unique", stack: "no" },
  { name: "Power of the First Lord", effect: "Increases damage by 1.2x for 15s after a charged heavy", category: "unique", stack: "no" },
  { name: "Power of the Ancestral Spirit", effect: "Chance to lower enemy damage negation by 10% for 20s on hit", category: "unique", stack: "no" },
  { name: "Power of the Dark Moon", effect: "Lowers enemy magic damage negation by 15% for 20s on hit", category: "unique", stack: "no" },
  { name: "Power of Vengeance", effect: "Per stack: +0.7% HP/FP/stamina/damage & +0.1% negation to 30 stacks, +0.45% to 50, +0.2% to 100 (cap +40% / +10% negation)", category: "unique", stack: "no", note: "Stacks additively." },
  { name: "Power of the Golden Order", effect: "Charge attacks heal all ailments and dispel all temporary effects", category: "unique", stack: "no" },
  { name: "Power of the Blasphemous", effect: "Restores 100 HP on enemy kill", category: "unique", stack: "no" },
  { name: "Power of the Undefeated", effect: "Attacks after taking damage partially recover HP", category: "unique", stack: "no", note: "Works like Malenia's Great Rune." },
];
