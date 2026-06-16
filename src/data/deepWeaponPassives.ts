import type { WeaponPassive } from "@/lib/weaponPassives";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  DEEP WEAPON PASSIVES
 * ─────────────────────────────────────────────────────────────────────────
 *  The pool of effects that roll on Deep weapons. Same shape as normal
 *  passives, plus a Curse category of drawbacks. From the community sheet.
 */
export const deepWeaponPassives: WeaponPassive[] = [
  // ── Stat ────────────────────────────────────────────────────────────────
  { name: "Increased Maximum HP", effect: "Increases maximum HP by 1.08x / 1.12x", category: "stat", stack: "yes" },
  { name: "Increased Maximum FP", effect: "Increases maximum FP by 1.09x / 1.13x", category: "stat", stack: "yes" },
  { name: "Increased Maximum Stamina", effect: "Increases maximum stamina by 1.08x / 1.12x", category: "stat", stack: "yes" },

  // ── Exploration ───────────────────────────────────────────────────────────
  { name: "More Runes From Defeated Enemies", effect: "Increases rune gain by 1.06x / 1.09x", category: "exploration", stack: "yes" },

  // ── Offensive ─────────────────────────────────────────────────────────────
  { name: "Physical Attack Up", effect: "Increases physical attack damage by 1.055x / 1.08x", category: "offensive", stack: "yes" },
  { name: "Improved Affinity Attack Power", effect: "Increases magic/fire/lightning/holy damage by 1.055x / 1.08x", category: "offensive", stack: "yes" },
  { name: "Improved Thrusting Counterattack", effect: "Increases counterhit damage by 1.1x / 1.15x", category: "offensive", stack: "yes" },
  { name: "Improved Stance-Breaking", effect: "Increases poise damage by 1.08x / 1.12x", category: "offensive", stack: "yes" },
  { name: "Improved Sorceries & Incantations", effect: "Increases spell damage by 1.055x / 1.08x", category: "offensive", stack: "yes" },
  { name: "Increased Sorcery & Incantation Duration", effect: "Increases spell duration by 1.45x / 1.6x", category: "offensive", stack: "yes" },
  { name: "Ice Storm upon Charged Attacks", effect: "Frost-wind attack after a charged heavy; buffs the weapon with 20 frost buildup for 20s", category: "offensive", stack: "no" },
  { name: "Black Flames upon Charged Attacks", effect: "Black flame on the ground after a charged heavy; buffs the weapon with 12 fire AP + damage-over-time for 7s", category: "offensive", stack: "no" },
  { name: "Phantom Attack upon Charged Attacks", effect: "Performs the Phantom Slash skill after a charged heavy", category: "offensive", stack: "no" },
  { name: "Holy Shockwave upon Charged Attacks", effect: "Performs Wave of Gold after a charged heavy; buffs the weapon with 12 holy AP for 20s", category: "offensive", stack: "no" },
  { name: "Luring Enemies upon Charged Attacks", effect: "Gravity pulse that pulls in enemies after a charged heavy", category: "offensive", stack: "no" },
  { name: "Magma upon Charged Attacks", effect: "Creates magma after a charged heavy; buffs the weapon with 12 fire AP for 20s", category: "offensive", stack: "no" },
  { name: "Lightning upon Charged Attacks", effect: "Lightning blast after a charged heavy; buffs the weapon with 12 lightning AP for 20s", category: "offensive", stack: "no" },
  { name: "Charged Attacks Invoke Sleep Mist", effect: "Sleep mist after a charged heavy; buffs the weapon with 20 sleep buildup for 20s", category: "offensive", stack: "no" },
  { name: "Projectiles Launched upon Charged Attacks", effect: "Fires 3 magic projectiles after a charged heavy bow shot", category: "offensive", stack: "no" },
  { name: "Lightning upon Precision Aiming", effect: "Creates a lightning effect where a manually-aimed bow shot lands", category: "offensive", stack: "no" },
  { name: "Poison Mist upon Precision Aiming", effect: "Creates a poison mist where a manually-aimed bow shot lands", category: "offensive", stack: "no" },
  { name: "Rot Mist upon Precision Aiming", effect: "Creates a scarlet-rot mist where a manually-aimed bow shot lands", category: "offensive", stack: "no" },
  { name: "Bloodflies upon Precision Aiming", effect: "Summons bloodflies where a manually-aimed bow shot lands", category: "offensive", stack: "no" },
  { name: "Guarding Ups Sorceries & Incantations", effect: "After blocking with a staff/seal for 2s: +1.1x spell damage and +30 virtual Dex for 25s (stacks up to 3x)", category: "offensive", stack: "no" },

  // ── Defensive ─────────────────────────────────────────────────────────────
  { name: "Improved Poise", effect: "Reduces incoming poise damage by 0.8x / 0.67x", category: "defensive", stack: "yes" },
  { name: "All Resistances Up", effect: "Increases all status-effect resistance by 52 / 65", category: "defensive", stack: "yes" },
  { name: "Shielding Creates Holy Ground", effect: "Creates holy ground after blocking with a shield for 3s", category: "defensive", stack: "no" },
  { name: "Broken Stance Activates Endure", effect: "When your guard breaks: +30% damage negation and immunity to stagger for 3.5s", category: "defensive", stack: "no" },

  // ── Regen ───────────────────────────────────────────────────────────────
  { name: "Improved Stamina Recovery", effect: "Increases stamina recovery by 3 / 5", category: "regen", stack: "yes" },
  { name: "Improved Flask HP Restoration", effect: "Increases HP gained from flasks by 1.13x / 1.18x", category: "regen", stack: "yes" },
  { name: "Flask Healing Also Restores FP", effect: "Restores 20% of max FP when drinking a flask", category: "regen", stack: "yes" },
  { name: "Failing to Cast Spell Restores FP", effect: "Restores 13% of max FP after a failed cast (insufficient FP)", category: "regen", stack: "no" },

  // ── Curse (drawbacks) ─────────────────────────────────────────────────────
  { name: "Reduced Maximum HP", effect: "Reduces maximum HP by 0.96x / 0.94x", category: "curse", stack: "yes" },
  { name: "Reduced Maximum FP", effect: "Reduces maximum FP by 0.94x / 0.91x", category: "curse", stack: "yes" },
  { name: "Reduced Maximum Stamina", effect: "Reduces maximum stamina by 0.95x / 0.92x", category: "curse", stack: "yes" },
  { name: "Near Death Reduces Max HP", effect: "−0.85x maximum HP for 30s after being downed", category: "curse", stack: "yes" },
  { name: "Attacks Impaired on Occasion", effect: "3% / 5% chance for an attack to deal no damage", category: "curse", stack: "yes" },
  { name: "Lower Attack When Below Max HP", effect: "−0.95x / 0.93x damage when HP is below 85%", category: "curse", stack: "yes" },
  { name: "Slower Art Gauge When Below Max HP", effect: "−0.9x / 0.85x ultimate-gauge gain when HP is below 85%", category: "curse", stack: "yes", note: "Unlike the Ultimate Art Gauge effect, this affects gauge gained from attacking." },
  { name: "Near Death Reduces Art Gauge", effect: "−25 / 33 ultimate gauge when the wearer is downed", category: "curse", stack: "yes" },
  { name: "Impaired Physical Damage Negation", effect: "+5.5% / 8% physical damage taken", category: "curse", stack: "yes" },
  { name: "Impaired Affinity Damage Negation", effect: "+5.5% / 8% magic/fire/lightning/holy damage taken", category: "curse", stack: "yes" },
  { name: "More Damage Taken After Evasion", effect: "+15% / 20% damage taken right after rolling", category: "curse", stack: "yes" },
  { name: "Repeated Evasions Lower Damage Negation", effect: "+23% / 30% damage taken for 15s on repeated rolls", category: "curse", stack: "yes" },
  { name: "Reduced Damage Negation for Flask Usages", effect: "+33% / 46% damage taken when using a flask", category: "curse", stack: "yes" },
  { name: "Lower Stamina Impairs Dmg Negation", effect: "+10% / 15% damage taken when stamina is at or below 50%", category: "curse", stack: "yes" },
  { name: "Night's Tide Damage Increased", effect: "+2x / 2.5x damage taken from the Night's Tide", category: "curse", stack: "yes" },
  { name: "Damage Increased by Night's Encroachment", effect: "+1% / 2.5% damage taken, applied up to 4 times per day", category: "curse", stack: "yes", note: "Roughly: day start, 1st circle closed, 2nd circle closing, 2nd circle closed. Stacks reset after the Night 1 boss." },
  { name: "All Resistances Down", effect: "−30 / 45 status resistance", category: "curse", stack: "yes" },
  { name: "Ailments Cause Increased Damage", effect: "+30% / 45% status damage received", category: "curse", stack: "yes" },
  { name: "Reduced Flask HP Restoration", effect: "−0.94x / 0.91x HP gained from flasks", category: "curse", stack: "yes" },
  { name: "Continuous HP Loss", effect: "Lose 1 HP every 1s / 0.67s", category: "curse", stack: "yes" },
  { name: "Poison Buildup When Below Max HP", effect: "+2 poison every 0.28 / 0.22s when HP is below 85%", category: "curse", stack: "yes" },
  { name: "Rot Buildup When Below Max HP", effect: "+2 rot every 0.32 / 0.24s when HP is below 85%", category: "curse", stack: "yes" },
];
