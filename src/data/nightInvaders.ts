// ─────────────────────────────────────────────────────────────────────────
//  Night Invader drop-specific passives.
//
//  Each Nightfarer has a pool of passives that Night Invaders drop for them.
//  Revenant has no Night Invader.
//
//  Source: community sheet
//  https://docs.google.com/spreadsheets/d/1Yu1QWcDTBSIwx3NA9SuyrxqY7pCeE9jzzb9wcRInVJg
// ─────────────────────────────────────────────────────────────────────────

export interface NightInvaderDrops {
  nightfarer: string;
  /** Drop-specific passives for this Nightfarer (empty if none). */
  passives: string[];
  /** Shown when there are no drops (e.g. no Night Invader exists). */
  note?: string;
}

export const nightInvaderDrops: NightInvaderDrops[] = [
  {
    nightfarer: "Wylder",
    passives: [
      "Skill DMG +",
      "Skill FP cost -",
      "Continuous HP regen",
      "HP regen on hit",
      "FP regen on hit",
      "Taking damage restores FP",
      "Taking damage ups negation",
    ],
  },
  {
    nightfarer: "Guardian",
    passives: [
      "Magic negation +",
      "Fire negation +",
      "Lightning negation +",
      "Holy negation +",
      "Guarding ability +",
      "Guard counters DMG +",
      "Guarding ups poise",
      "Guarding ups negation",
    ],
  },
  {
    nightfarer: "Ironeye",
    passives: [
      "Range weapon DMG +",
      "Item discovery +",
      "Targeting -",
      "Continuous HP regen",
      "HP regen on kill",
      "Full HP DMG +",
      "Full HP negation +",
    ],
  },
  {
    nightfarer: "Duchess",
    passives: [
      "Critical DMG +",
      "Dual wield DMG +",
      "Glintblades",
      "HP regen on hit",
      "Successive hits ups negation",
      "Full HP DMG +",
      "Full HP negation +",
    ],
  },
  {
    nightfarer: "Scholar",
    passives: [
      "Full HP DMG +",
      "Full HP negation +",
      "Successive hits ups negation",
      "HP regen on hit",
      "FP regen on hit",
      "Melee DMG +",
      "Rolling DMG +",
    ],
  },
  {
    nightfarer: "Raider",
    passives: [
      "Two hand DMG +",
      "Dual wield DMG +",
      "Charge attack DMG +",
      "Jump attack DMG +",
      "Charged attack ups negation",
      "Taking damage restores FP",
      "Taking damage ups negation",
    ],
  },
  {
    nightfarer: "Revenant",
    passives: [],
    note: "No Night Invader",
  },
  {
    nightfarer: "Recluse",
    passives: [
      "Magic DMG +",
      "Sorcery DMG +",
      "Charged sorcery DMG +",
      "Cast speed +",
      "Spell FP cost -",
      "Casting spells ups negation",
      "Full HP negation +",
    ],
  },
  {
    nightfarer: "Executor",
    passives: [
      "Two hand DMG +",
      "Skill DMG +",
      "Skill FP cost -",
      "HP regen on hit",
      "Successive hits ups negation",
      "HP regen on kill",
      "FP regen on kill",
    ],
  },
  {
    nightfarer: "Undertaker",
    passives: [
      "Taking damage ups negation",
      "Melee DMG +",
      "Full HP DMG +",
      "Full HP negation +",
      "Chain attack finisher DMG +",
      "Skill DMG +",
      "Skill FP cost -",
    ],
  },
];
