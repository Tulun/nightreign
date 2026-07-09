import type {
  NightlordStatBlockRef,
  NightlordStatRow,
  NightlordStatTable,
  StatVariant,
} from "@/lib/nightlordStats";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NIGHTLORD / NIGHT BOSS STATS — health, per-type damage negation, status
 *  resistances and poise, per team size (solo/duo/trio) and variant
 *  (normal / everdark). Shown on the Nightlords page. Source: community sheet.
 *  Negation values are % (negative = weakness). Resists: number or "Immune".
 * ─────────────────────────────────────────────────────────────────────────
 */
export const nightlordStats: NightlordStatTable[] = [
  {
    team: "solo", variant: "normal", gid: 1375345720,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000020, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75002020, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75003020, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75100020, health: 13140, poise: 150, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200020, health: 13027, poise: 100, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200110, health: 13027, poise: 100, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300010, health: 13027, poise: 150, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300110, health: 13027, poise: 150, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75400020, health: 12687, poise: 150, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75600020, health: 13048, poise: 120, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76000010, health: 11894, poise: 155, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49000010, health: 12008, poise: 160, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Weapon-Bequeathed Harmonia", id: 76200010, health: null, poise: 75, negations: { phys: 0, strike: -10, slash: 8, pierce: 0, magic: 0, fire: 8, lightning: 10, holy: 30 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: 84, madness: "Immune", blight: "Immune" } },
      { name: "Traitorous Straghess", id: 76100010, health: 11554, poise: 150, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "Pure Impulse Straghess", id: 76100010, health: 11554, poise: 150, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "The Shape of Night", id: 75800010, health: 4985, poise: 130, negations: { phys: 0, strike: 10, slash: -15, pierce: -10, magic: 0, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Heolstor the Nightlord", id: 75802010, health: 10196, poise: 130, negations: { phys: 0, strike: -10, slash: 10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -30 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
  {
    team: "duo", variant: "normal", gid: 1250313567,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000020, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75002020, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75003020, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75100020, health: 26280, poise: 272.7, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200020, health: 26054, poise: 181.8, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200110, health: 26054, poise: 181.8, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300010, health: 26054, poise: 272.7, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300110, health: 26054, poise: 272.7, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75400020, health: 25374, poise: 272.7, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75600020, health: 26096, poise: 218.2, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76000010, health: 23788, poise: 281.8, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49000010, health: 24016, poise: 290.9, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Weapon-Bequeathed Harmonia", id: 76200010, health: null, poise: 136.4, negations: { phys: 0, strike: -10, slash: 8, pierce: 0, magic: 0, fire: 8, lightning: 10, holy: 30 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: 84, madness: "Immune", blight: "Immune" } },
      { name: "Traitorous Straghess", id: 76100010, health: 23108, poise: 272.7, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "Pure Impulse Straghess", id: 76100010, health: 23108, poise: 272.7, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "The Shape of Night", id: 75800010, health: 9970, poise: 236.4, negations: { phys: 0, strike: 10, slash: -15, pierce: -10, magic: 0, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Heolstor the Nightlord", id: 75802010, health: 20392, poise: 236.4, negations: { phys: 0, strike: -10, slash: 10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -30 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
  {
    team: "trio", variant: "normal", gid: 584028384,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000020, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75002020, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (SIngle Dog)", id: 75003020, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75100020, health: 39420, poise: 500, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200020, health: 39081, poise: 333.3, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200110, health: 39081, poise: 333.3, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300010, health: 39081, poise: 500, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300110, health: 39081, poise: 500, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75400020, health: 38061, poise: 500, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75600020, health: 39144, poise: 400, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76000010, health: 35682, poise: 516.7, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49000010, health: 36024, poise: 533.3, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Weapon-Bequeathed Harmonia", id: 76200010, health: null, poise: 250, negations: { phys: 0, strike: -10, slash: 8, pierce: 0, magic: 0, fire: 8, lightning: 10, holy: 30 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: 84, madness: "Immune", blight: "Immune" } },
      { name: "Traitorous Straghess", id: 76100010, health: 34662, poise: 500, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "Pure Impulse Straghess", id: 76100010, health: 34662, poise: 500, negations: { phys: 0, strike: 0, slash: -10, pierce: -10, magic: 0, fire: -20, lightning: 10, holy: -25 }, resistances: { poison: 542, rot: 542, bleed: 252, frost: 252, sleep: 252, madness: "Immune", blight: "Immune" } },
      { name: "The Shape of Night", id: 75800010, health: 14955, poise: 433.3, negations: { phys: 0, strike: 10, slash: -15, pierce: -10, magic: 0, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Heolstor the Nightlord", id: 75802010, health: 30588, poise: 433.3, negations: { phys: 0, strike: -10, slash: 10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -30 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: "Immune", sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
  {
    team: "solo", variant: "everdark", gid: 639239396,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000210, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75002210, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75003210, health: 11328, poise: 120, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75110010, health: 16426, poise: 150, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200120, health: 7816, poise: 100, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200030, health: 7816, poise: 100, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Animus, Ascendant Light", id: 75210010, health: 6364, poise: 100, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: 0, holy: 0 }, resistances: { poison: "Immune", rot: "Immune", bleed: "Immune", frost: "Immune", sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300120, health: 8564, poise: 150, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300020, health: 8564, poise: 150, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Augur", id: 75400100, health: 3171, poise: 150, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75410000, health: 29452, poise: 600, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75610010, health: 13048, poise: 120, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76001010, health: 14273, poise: 155, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49010010, health: 12007, poise: 160, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
  {
    team: "duo", variant: "everdark", gid: 1871926402,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000210, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75002210, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75003210, health: 22656, poise: 218.2, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75110010, health: 32852, poise: 272.7, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200120, health: 15632, poise: 181.8, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200030, health: 15632, poise: 181.8, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Animus, Ascendant Light", id: 75210010, health: 12728, poise: 181.8, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: 0, holy: 0 }, resistances: { poison: "Immune", rot: "Immune", bleed: "Immune", frost: "Immune", sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300120, health: 17128, poise: 272.7, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300020, health: 17128, poise: 272.7, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Augur", id: 75400100, health: 6342, poise: 272.7, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75410000, health: 58904, poise: 1090.9, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75610010, health: 26096, poise: 218.2, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76001010, health: 28546, poise: 281.8, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49010010, health: 24014, poise: 290.9, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
  {
    team: "trio", variant: "everdark", gid: 736930706,
    rows: [
      { name: "Gladius, Beast of Night", id: 75000210, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75002210, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gladius, Beast of Night (Single Dog)", id: 75003210, health: 33984, poise: 400, negations: { phys: 0, strike: 0, slash: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35 }, resistances: { poison: 542, rot: 252, bleed: 252, frost: 542, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Adel, Baron of Night", id: 75110010, health: 49278, poise: 500, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0 }, resistances: { poison: 154, rot: 154, bleed: 542, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 1)", id: 75200120, health: 23448, poise: 333.3, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Gnoster, Wisdom of Night (Phase 2)", id: 75200030, health: 23448, poise: 333.3, negations: { phys: -15, strike: -15, slash: -25, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10 }, resistances: { poison: 542, rot: 154, bleed: 154, frost: 154, sleep: 542, madness: "Immune", blight: "Immune" } },
      { name: "Animus, Ascendant Light", id: 75210010, health: 19092, poise: 333.3, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: 0, holy: 0 }, resistances: { poison: "Immune", rot: "Immune", bleed: "Immune", frost: "Immune", sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 1)", id: 75300120, health: 25692, poise: 500, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Faurtis Stoneshield (Phase 2)", id: 75300020, health: 25692, poise: 500, negations: { phys: 10, strike: -20, slash: 20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10 }, resistances: { poison: 252, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Augur", id: 75400100, health: 9513, poise: 500, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Maris, Fathom of Night", id: 75410000, health: 88356, poise: 2000, negations: { phys: 0, strike: 20, slash: -15, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15 }, resistances: { poison: "Immune", rot: 252, bleed: "Immune", frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" } },
      { name: "Libra, Creature of Night", id: 75610010, health: 39144, poise: 400, negations: { phys: 0, strike: 0, slash: -10, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35 }, resistances: { poison: 154, rot: 154, bleed: 252, frost: 252, sleep: "Immune", madness: 154, blight: "Immune" } },
      { name: "Fulghor, Champion of Nightglow", id: 76001010, health: 42819, poise: 516.7, negations: { phys: 0, strike: 0, slash: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30 }, resistances: { poison: 154, rot: 154, bleed: 154, frost: 154, sleep: 154, madness: "Immune", blight: "Immune" } },
      { name: "Caligo, Miasma of Night", id: 49010010, health: 36021, poise: 533.3, negations: { phys: 0, strike: -15, slash: 15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20 }, resistances: { poison: 252, rot: 252, bleed: 252, frost: 542, sleep: 542, madness: "Immune", blight: "Immune" } },
    ],
  },
];

/**
 * Everdark Balancers isn't in the community sheet yet — stubbed from the
 * Fextralife Everdark Sovereign page (Weapon Bequeathed Harmonia). Negations
 * & status resistances are exact; HP and poise are undocumented. These apply
 * to every team size. Blight assumed Immune (matches the normal variant).
 */
export const everdarkStatStubs: NightlordStatRow[] = [
  {
    name: "Weapon-Bequeathed Harmonia", id: 76200010, health: null, poise: null,
    negations: { phys: 0, strike: -10, slash: 8, pierce: 0, magic: 0, fire: 8, lightning: 10, holy: 30 },
    resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: 84, madness: "Immune", blight: "Immune" },
    note: "Stubbed from the Fextralife wiki — HP & poise not yet documented.",
  },
  {
    name: "Harmonia Worm", id: 76200010, health: null, poise: null,
    negations: { phys: -12, strike: -12, slash: -23.2, pierce: -23.2, magic: -12, fire: -12, lightning: -12, holy: 32.8 },
    resistances: { poison: 252, rot: 252, bleed: 252, frost: 252, sleep: "Immune", madness: "Immune", blight: "Immune" },
    note: "Weak to Slash & Pierce; immune to Sleep (unlike the valkyries). Stubbed from the Fextralife wiki — HP & poise not yet documented.",
  },
];

/**
 * Which stat-table rows make up each Nightlord's display, per variant.
 * A variant with no entry means no data (e.g. no Everdark Sovereign exists).
 * Rows are matched by `name` within the table for the selected team size,
 * falling back to `everdarkStatStubs` on the everdark variant.
 */
export const NIGHTLORD_STAT_MAP: Record<string, Partial<Record<StatVariant, NightlordStatBlockRef[]>>> = {
  gladius: {
    normal: [{ row: "Gladius, Beast of Night" }],
    everdark: [{ row: "Gladius, Beast of Night" }],
  },
  adel: {
    normal: [{ row: "Adel, Baron of Night" }],
    everdark: [{ row: "Adel, Baron of Night" }],
  },
  gnoster: {
    normal: [
      { label: "Gnoster (Moth)", row: "Gnoster, Wisdom of Night (Phase 1)" },
      { label: "Faurtis (Scorpion)", row: "Faurtis Stoneshield (Phase 1)" },
    ],
    everdark: [
      { label: "Gnoster (Moth)", row: "Gnoster, Wisdom of Night (Phase 1)" },
      { label: "Faurtis (Scorpion)", row: "Faurtis Stoneshield (Phase 1)" },
      { label: "Final Phase · Animus, Ascendant Light", row: "Animus, Ascendant Light" },
    ],
  },
  maris: {
    normal: [{ row: "Maris, Fathom of Night" }],
    everdark: [
      { label: "Maris, Fathom of Night", row: "Maris, Fathom of Night" },
      { label: "Augur (summon)", row: "Augur" },
    ],
  },
  libra: {
    normal: [{ row: "Libra, Creature of Night" }],
    everdark: [{ row: "Libra, Creature of Night" }],
  },
  fulghor: {
    normal: [{ row: "Fulghor, Champion of Nightglow" }],
    everdark: [{ row: "Fulghor, Champion of Nightglow" }],
  },
  caligo: {
    normal: [{ row: "Caligo, Miasma of Night" }],
    everdark: [{ row: "Caligo, Miasma of Night" }],
  },
  heolstor: {
    normal: [
      { label: "Phase 1 · The Shape of Night", row: "The Shape of Night" },
      { label: "Phase 2 · Heolstor the Nightlord", row: "Heolstor the Nightlord" },
    ],
  },
  balancers: {
    normal: [{ row: "Weapon-Bequeathed Harmonia" }],
    everdark: [
      { label: "Valkyries", row: "Weapon-Bequeathed Harmonia" },
      { label: "Final Phase · Worm", row: "Harmonia Worm" },
    ],
  },
  dreglord: {
    normal: [
      { label: "Phase 1 · Traitorous Straghess", row: "Traitorous Straghess" },
      { label: "Phase 2 · Pure Impulse Straghess", row: "Pure Impulse Straghess" },
    ],
  },
};
