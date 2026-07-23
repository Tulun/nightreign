// ─────────────────────────────────────────────────────────────────────────
//  Depth buffs — enemy HP & Damage scaling per Depth (D1–D5).
//
//  D1–D5 are the baseline boosts an enemy gets at that depth. "R" is the extra
//  buff a Red (empowered) variant gets, added on top of that depth's value;
//  N/A = that enemy type has no Red variant. A couple of types show two R
//  values ("depends on type").
//
//  Columns are [R, D1, D2, D3, D4, D5].
// ─────────────────────────────────────────────────────────────────────────

export const DEPTH_COLUMNS = ["R", "D1", "D2", "D3", "D4", "D5"] as const;

export interface DepthBuff {
  enemy: string;
  note?: string;
  /** [R, D1, D2, D3, D4, D5] */
  hp: string[];
  dmg: string[];
}

export const depthBuffs: DepthBuff[] = [
  {
    enemy: "Trash Mob",
    hp: ["+100%", "+35%", "+43%", "+53%", "+72%", "+80%"],
    dmg: ["+100%", "+35%", "+61%", "+91%", "+166%", "+211%"],
  },
  {
    enemy: "Minor POI Boss",
    note: "depends on type",
    hp: ["+65% / +80%", "+30%", "+38%", "+47%", "+65%", "+73%"],
    dmg: ["+50% / +75%", "+30%", "+55%", "+84%", "+154%", "+195%"],
  },
  {
    enemy: "Oldest Gaol",
    hp: ["+15%", "+20%", "+27%", "+35%", "+52%", "+60%"],
    dmg: ["+15%", "+20%", "+37%", "+56%", "+97%", "+122%"],
  },
  {
    enemy: "Castle Elite Mobs",
    note: "depends on type",
    hp: ["+65% / +80%", "+30%", "+38%", "+47%", "+65%", "+73%"],
    dmg: ["+50% / +75%", "+30%", "+55%", "+84%", "+154%", "+195%"],
  },
  {
    enemy: "Regular Field Boss",
    hp: ["+65%", "+30%", "+38%", "+47%", "+65%", "+73%"],
    dmg: ["+50%", "+30%", "+55%", "+84%", "+154%", "+195%"],
  },
  {
    enemy: "Formidable Field Boss",
    hp: ["+15%", "+20%", "+27%", "+35%", "+52%", "+60%"],
    dmg: ["+15%", "+20%", "+37%", "+56%", "+97%", "+122%"],
  },
  {
    enemy: "Invaders",
    hp: ["N/A", "+20%", "+27%", "+35%", "+52%", "+60%"],
    dmg: ["N/A", "+20%", "+37%", "+56%", "+97%", "+122%"],
  },
  {
    enemy: "Night 1 Boss",
    hp: ["N/A", "+35%", "+51%", "+70%", "+111%", "+133%"],
    dmg: ["N/A", "+35%", "+67%", "+112%", "+214%", "+270%"],
  },
  {
    enemy: "Night 2 Boss",
    hp: ["N/A", "+30%", "+46%", "+64%", "+103%", "+125%"],
    dmg: ["N/A", "+30%", "+61%", "+104%", "+203%", "+257%"],
  },
  {
    enemy: "Nightlord",
    hp: ["N/A", "+25%", "+40%", "+57%", "+95%", "+116%"],
    dmg: ["N/A", "+25%", "+55%", "+92%", "+183%", "+231%"],
  },
];
