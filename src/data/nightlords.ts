import type { Nightlord } from "@/lib/nightlords";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NIGHTLORDS  ·  the 8 expedition end-bosses
 * ─────────────────────────────────────────────────────────────────────────
 *  Stats from the Fextralife boss pages. Negations: negative = weakness.
 *  Status resistances are the base buildup value (or "Immune"). HP is the
 *  solo (·) value; it scales with team size. Everdark shares negations/
 *  resistances with normal — only HP (and attack) is higher.
 */

export const NIGHTLORD_CREDIT = "Stats from eldenringnightreign.wiki.fextralife.com";

export const nightlords: Nightlord[] = [
  {
    id: "gladius", name: "Gladius, Beast of Night", alias: "Tricephalos",
    weaknesses: ["holy"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 },
    resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune" },
    hpNormal: 11328, hpEverdark: 17558,
    note: "Splits into three beasts. Resists Fire heavily.",
  },
  {
    id: "adel", name: "Adel, Baron of Night", alias: "Gaping Jaw",
    weaknesses: ["poison"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 },
    resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune" },
    hpNormal: 13140, hpEverdark: 16425,
    note: "No damage-type weakness — Poison stun-locks it instead.",
  },
  {
    id: "gnoster", name: "Gnoster, Wisdom of Night", alias: "Sentient Pest",
    weaknesses: ["fire"],
    negations: { standard: -15, slash: -25, strike: -15, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 },
    resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune" },
    hpNormal: 13027, hpEverdark: null,
    note: "Two forms — Gnoster (moth, shown) & Faurtis (scorpion). Both weak to Fire; resists Magic.",
  },
  {
    id: "maris", name: "Maris, Fathom of Night", alias: "Augur",
    weaknesses: ["lightning"],
    negations: { standard: 0, slash: -15, strike: 20, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 },
    resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune" },
    hpNormal: 12687, hpEverdark: null,
    note: "Floating boss; immune to Poison/Bleed/Sleep. Everdark is two-phase.",
  },
  {
    id: "libra", name: "Libra, Creature of Night", alias: "Equilibrious Beast",
    weaknesses: ["madness", "holy", "fire"],
    negations: { standard: 0, slash: -10, strike: 0, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 },
    resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154 },
    hpNormal: 13048, hpEverdark: 18267,
    note: "Weak to Holy & Fire; one of the few that takes Madness. (See Libra Deals.)",
  },
  {
    id: "fulghor", name: "Fulghor, Champion of Nightglow", alias: "Darkdrift Knight",
    weaknesses: ["lightning"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 },
    resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune" },
    hpNormal: 11894, hpEverdark: 16652,
    note: "Centaur knight; resists Holy. Everdark hits ~18% harder.",
  },
  {
    id: "caligo", name: "Caligo, Miasma of Night", alias: "Fissure in the Fog",
    weaknesses: ["fire"],
    negations: { standard: 0, slash: 15, strike: -15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 },
    resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune" },
    hpNormal: 12007, hpEverdark: 16810,
    note: "Ice dragon — bring Fire. Strong against most other types.",
  },
  {
    id: "heolstor", name: "Heolstor the Nightlord", alias: "Night Aspect",
    weaknesses: ["holy"],
    negations: { standard: 0, slash: 10, strike: -10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -20 },
    resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune" },
    hpNormal: 11214, hpEverdark: null,
    note: "Final Nightlord, two phases (Shape of Night → Heolstor). Stats shown are Phase 2; Phase 1 is −35 Holy.",
  },
];
