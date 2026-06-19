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
    id: "gladius", name: "Gladius, Beast of Night", alias: "Tricephalos", expedition: "Tricephalos",
    events: ["Night Horde", "Meteor Strike", "Judgment"],
    weaknesses: ["holy"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 },
    resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune" },
    hpNormal: 11328, hpEverdark: 17558,
    note: "Splits into three beasts. Resists Fire heavily.",
  },
  {
    id: "adel", name: "Adel, Baron of Night", alias: "Gaping Jaw", expedition: "Gaping Jaw",
    events: ["Fell Omen Invasion", "Double Night Boss", "Meteor Strike", "Judgment"],
    weaknesses: ["poison"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 },
    resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune" },
    hpNormal: 13140, hpEverdark: 16425,
    note: "No damage-type weakness — Poison stun-locks it instead.",
  },
  {
    id: "gnoster", name: "Gnoster, Wisdom of Night", alias: "Sentient Pest", expedition: "Sentient Pest",
    events: ["Fell Omen Invasion", "Plague of Locusts", "Giant Bubbles", "Flame of Frenzy", "Judgment"],
    weaknesses: ["fire"],
    negations: { standard: -15, slash: -25, strike: -15, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 },
    resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune" },
    hpNormal: 13027, hpEverdark: null,
    note: "Two forms — Gnoster (moth, shown) & Faurtis (scorpion). Both weak to Fire; resists Magic.",
  },
  {
    id: "maris", name: "Maris, Fathom of Night", alias: "Augur", expedition: "Augur",
    events: ["Plague of Locusts", "Night Horde", "Wandering Mausoleum", "Judgment"],
    weaknesses: ["lightning"],
    negations: { standard: 0, slash: -15, strike: 20, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 },
    resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune" },
    hpNormal: 12687, hpEverdark: null,
    note: "Floating boss; immune to Poison/Bleed/Sleep. Everdark is two-phase.",
  },
  {
    id: "libra", name: "Libra, Creature of Night", alias: "Equilibrious Beast", expedition: "Equilibrious Beast",
    events: ["Plague of Locusts", "Flame of Frenzy", "Judgment"],
    weaknesses: ["madness", "holy", "fire"],
    negations: { standard: 0, slash: -10, strike: 0, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 },
    resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154 },
    hpNormal: 13048, hpEverdark: 18267,
    note: "Weak to Holy & Fire; one of the few that takes Madness. (See Libra Deals.)",
  },
  {
    id: "fulghor", name: "Fulghor, Champion of Nightglow", alias: "Darkdrift Knight", expedition: "Darkdrift Knight",
    events: ["Double Night Boss", "Night Horde", "Curse of the Demon", "Judgment"],
    weaknesses: ["lightning"],
    negations: { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 },
    resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune" },
    hpNormal: 11894, hpEverdark: 16652,
    note: "Centaur knight; resists Holy. Everdark hits ~18% harder.",
  },
  {
    id: "caligo", name: "Caligo, Miasma of Night", alias: "Fissure in the Fog", expedition: "Fissure in the Fog",
    events: ["Curse of the Demon", "Giant Bubbles", "Wandering Mausoleum", "Meteor Strike", "Judgment"],
    weaknesses: ["fire"],
    negations: { standard: 0, slash: 15, strike: -15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 },
    resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune" },
    hpNormal: 12007, hpEverdark: 16810,
    note: "Ice dragon — bring Fire. Strong against most other types.",
  },
  {
    id: "heolstor", name: "Heolstor the Nightlord", alias: "Night Aspect", expedition: "Night Aspect",
    events: ["Fell Omen Invasion", "Plague of Locusts", "Curse of the Demon", "Giant Bubbles", "Judgment"],
    weaknesses: ["holy"],
    negations: { standard: 0, slash: 10, strike: -10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -20 },
    resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune" },
    hpNormal: 11214, hpEverdark: null,
    note: "Final Nightlord. Phase 1 (Shape of Night) is hardest hit by Holy; Phase 2 (Heolstor) shifts toward Strike/Lightning/Holy. Immune to Poison, Bleed, Frost & Madness throughout.",
    phases: [
      {
        label: "Phase 1 · Shape of Night",
        hp: 4984,
        negations: { standard: 0, slash: -15, strike: 10, pierce: -10, magic: 0, fire: -20, lightning: 0, holy: -35 },
        resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune" },
      },
      {
        label: "Phase 2 · Heolstor",
        hp: 11214,
        negations: { standard: 0, slash: 10, strike: -10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -20 },
        resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune" },
      },
    ],
  },
  // ── Forsaken Hollows DLC ──────────────────────────────────────────────
  {
    id: "balancers", name: "Weapon Bequeathed Harmonia", alias: "Balancers", expedition: "Balancers",
    events: ["Flame of Frenzy", "Fire Wolves", "Blizzard"],
    weaknesses: ["strike", "sleep"],
    negations: { standard: 0, slash: 8, strike: -10, pierce: 0, magic: 0, fire: 8, lightning: 10, holy: 30 },
    resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: 84, madness: "Immune" },
    hpNormal: null, hpEverdark: null,
    note: "Seven valkyries — extremely weak to Sleep (84 buildup) and Strike. Resists Holy heavily. Revive at ~70% for Phase 2 (Everdark adds a leviathan Phase 3). HP not documented.",
  },
  {
    id: "dreglord", name: "Dreglord", alias: "Forsaken Hollows", expedition: "Dreglord",
    events: ["Fell Omen Invasion", "Curse of the Demon (?)", "Giant Bubbles (?)", "Judgment"],
    weaknesses: ["fire", "holy"],
    negations: { standard: 0, slash: -10, strike: 0, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 },
    resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune" },
    hpNormal: 11554, hpEverdark: null,
    note: "Weak to Fire & Holy (and Slash/Pierce); resists Lightning. Revives to full HP for Phase 2, which adds Scarlet Rot attacks but keeps the same defenses.",
    phases: [
      {
        label: "Phase 1 · Traitorous Straghess",
        hp: 11554,
        negations: { standard: 0, slash: -10, strike: 0, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 },
        resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune" },
      },
      {
        label: "Phase 2 · Pure Impulse Straghess",
        hp: 11554,
        negations: { standard: 0, slash: -10, strike: 0, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 },
        resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune" },
        note: "Revives to full HP — negations & resistances unchanged from Phase 1.",
      },
    ],
  },
];
