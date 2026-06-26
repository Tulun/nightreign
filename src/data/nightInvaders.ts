// ─────────────────────────────────────────────────────────────────────────
//  Night Invader drop-specific weapon passives, by Nightfarer.
//
//  Night Invaders drop weapon passives; the names below are the canonical
//  weapon-passive names (src/data/weaponPassives.ts), so the view can show each
//  one's value. Revenant has no Night Invader and is omitted.
//
//  Source: community sheet
//  https://docs.google.com/spreadsheets/d/1Yu1QWcDTBSIwx3NA9SuyrxqY7pCeE9jzzb9wcRInVJg
// ─────────────────────────────────────────────────────────────────────────

export interface NightInvaderDrops {
  nightfarer: string;
  /** Canonical weapon-passive names this Nightfarer's Night Invader drops. */
  passives: string[];
}

export const nightInvaderDrops: NightInvaderDrops[] = [
  {
    nightfarer: "Wylder",
    passives: [
      "Improved Skill Attack Power",
      "Reduced Skill FP Cost",
      "Continuous HP Recovery",
      "HP Restoration upon Landing Attacks",
      "FP Restoration upon Landing Attacks",
      "Taking Damage Restores FP",
      "Taking Damage Boosts Damage Negation",
    ],
  },
  {
    nightfarer: "Guardian",
    passives: [
      "Improved Magic Damage Negation",
      "Improved Fire Damage Negation",
      "Improved Lightning Damage Negation",
      "Improved Holy Damage Negation",
      "Improved Guarding Ability",
      "Improved Guard Counters",
      "Successful Guarding Ups Poise",
      "Successful Guarding Ups Damage Negation",
    ],
  },
  {
    nightfarer: "Ironeye",
    passives: [
      "Improved Ranged Weapon Attacks",
      "Improved Item Discovery",
      "Less Likely to Be Targeted",
      "Continuous HP Recovery",
      "Defeating Enemies Restores HP",
      "Improved Attack Power at Full HP",
      "Improved Damage Negation at Full HP",
    ],
  },
  {
    nightfarer: "Duchess",
    passives: [
      "Improved Critical Hits",
      "Attack Up When Wielding Two Armaments",
      "Multiple Periodical Glintblades",
      "HP Restoration upon Landing Attacks",
      "Successive Attacks Negate Damage",
      "Improved Attack Power at Full HP",
      "Improved Damage Negation at Full HP",
    ],
  },
  {
    nightfarer: "Scholar",
    passives: [
      "Improved Attack Power at Full HP",
      "Improved Damage Negation at Full HP",
      "Successive Attacks Negate Damage",
      "HP Restoration upon Landing Attacks",
      "FP Restoration upon Landing Attacks",
      "Improved Melee Attack Power",
      "Improved Rolling Attacks",
    ],
  },
  {
    nightfarer: "Raider",
    passives: [
      "Improved Attack Power When Two-Handing",
      "Attack Up When Wielding Two Armaments",
      "Improved Charged Attacks",
      "Improved Jump Attacks",
      "Damage Negation Up upon Landing Charge Attacks",
      "Taking Damage Restores FP",
      "Taking Damage Boosts Damage Negation",
    ],
  },
  {
    nightfarer: "Recluse",
    passives: [
      "Improved Magic Attack Power",
      "Improved Sorceries",
      "Improved Charged Sorceries",
      "Improved Spell Casting Speed",
      "Reduced Spell FP Cost",
      "Damage Negation Up While Casting Spells",
      "Improved Damage Negation at Full HP",
    ],
  },
  {
    nightfarer: "Executor",
    passives: [
      "Improved Attack Power When Two-Handing",
      "Improved Skill Attack Power",
      "Reduced Skill FP Cost",
      "HP Restoration upon Landing Attacks",
      "Successive Attacks Negate Damage",
      "Defeating Enemies Restores HP",
      "Defeating Enemies Restores FP",
    ],
  },
  {
    nightfarer: "Undertaker",
    passives: [
      "Taking Damage Boosts Damage Negation",
      "Improved Melee Attack Power",
      "Improved Attack Power at Full HP",
      "Improved Damage Negation at Full HP",
      "Improved Chain Attack Finishers",
      "Improved Skill Attack Power",
      "Reduced Skill FP Cost",
    ],
  },
];
