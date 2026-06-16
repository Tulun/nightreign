import type { FieldBossTier, LegendaryWeapon, PowerTier } from "@/lib/fieldBosses";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  BOSS LOOT POOLS
 * ─────────────────────────────────────────────────────────────────────────
 *  Field bosses (Low/Mid/High), POI bosses (Forts/Cathedrals = Low,
 *  Ruins/Camps = Mid), and Deep of Night "Cursed Red" bosses. Boss lists are
 *  partial; some bosses appear in more than one tier depending on where fought.
 */

export const FIELD_BOSS_CREDIT = "Loot-pool data from community research";
export const FIELD_BOSS_NOTE =
  "Boss lists are partial (29 total). “(Castle)” marks the stronger version of a boss fought inside a Fort/Castle/Ruins — its weaker version appears as a lower-tier field boss.";
export const POI_NOTE =
  "POI bosses split into Low (Forts & Cathedrals) and Mid (Ruins & Camps). Based on the POI's element, the weapon dropped is Standard or a matching elemental weapon (Fire, Lightning, Magic, Holy, Blood, Frost, Poison/Rot, Madness). *Marshes are assumed to behave like Forts/Cathedrals, and Blacksmith Villages like Ruins/Camps.";
export const RED_NOTE =
  "Deep of Night (ranked) adds Cursed “Red” bosses — red variants of field bosses that drop Red weapons and can roll S-Tier powers.";
export const LEGENDARY_NOTE =
  "When a drop rolls Legendary, this is the chance it's each weapon. Red-highlighted weapons are red-tier exclusives.";

/** Per-weapon odds that a Legendary drop is that weapon (sums to ~100%). */
export const legendaryWeapons: LegendaryWeapon[] = [
  { name: "Sword of Night & Flame", chance: 5.6 },
  { name: "Dragon King's Cragblade", chance: 5.6 },
  { name: "Eclipse Shotel", chance: 5.6 },
  { name: "Morgott's Cursed Sword", chance: 5.6 },
  { name: "Hand of Malenia", chance: 5.6 },
  { name: "Marika's Hammer", chance: 5.6 },
  { name: "Devourer's Scepter", chance: 5.6 },
  { name: "Bastard's Stars", chance: 5.6 },
  { name: "Bolt of Gransax", chance: 5.6 },
  { name: "Mohgwyn's Sacred Spear", chance: 5.6 },
  { name: "Giant's Red Braid", chance: 5.6 },
  { name: "Grafted Dragon", chance: 5.6 },
  { name: "Axe of Godfrey", chance: 5.6 },
  { name: "Carian Regal Scepter", chance: 5.6 },
  { name: "Lion Greatbow", chance: 5.6 },
  { name: "Axe of Godrick", chance: 2.8 },
  { name: "Winged Greathorn", chance: 2.8 },
  { name: "Maliketh's Black Blade", chance: 1.4 },
  { name: "Starscourge Greatsword", chance: 1.4 },
  { name: "Ruins Greatsword", chance: 1.4 },
  { name: "Grafted Blade Greatsword", chance: 1.4, red: true },
  { name: "Dark Moon Greatsword", chance: 1.1 },
  { name: "Sacred Relic Sword", chance: 1.1 },
  { name: "Blasphemous Blade", chance: 1.1 },
  { name: "Golden Order Greatsword", chance: 1.1 },
  { name: "Marais Executioner's Sword", chance: 1.1, red: true },
];

export const fieldBossTiers: FieldBossTier[] = [
  {
    key: "low",
    label: "Low-Tier",
    poolLabel: "Low Pool",
    accent: "#7bb24a",
    powerTierKeys: ["B-Tier"],
    bosses: ["Red Wolf", "Leonine", "Golden Hippo", "Royal Revenant", "Black Knife Assassin", "Grafted Scion"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 60, label: "Random Blue Weapon", kind: "blue" },
          { chance: 30, label: "Class-Specific Blue Weapon", kind: "class-blue" },
          { chance: 10, label: "Random Purple Weapon", kind: "purple" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 95, label: "Random Blue Weapon", kind: "blue" },
          { chance: 5, label: "Random Purple Weapon", kind: "purple" },
        ],
      },
      { name: "Slot 3 · Dormant Power", outcomes: [{ chance: 100, label: "B-Tier Power", kind: "power" }] },
    ],
  },
  {
    key: "mid",
    label: "Mid-Tier",
    poolLabel: "Mid Pool",
    accent: "#d4a017",
    powerTierKeys: ["A-Tier"],
    bosses: ["Flying Dragon", "Ancestor Spirit", "Magma Wyrm", "Ancient Zamor (Castle)", "Bell Bearing Hunter (Castle)", "Leonine (Castle)", "Black Knife Assassin (Castle)"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Random Purple Weapon", kind: "purple" },
          { chance: 35, label: "Class-Specific Purple Weapon", kind: "class-purple" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 90, label: "Random Purple Weapon", kind: "purple" },
          { chance: 10, label: "Random Legendary Weapon", kind: "legendary" },
        ],
      },
      {
        name: "Slot 3 · Dormant Power",
        outcomes: [
          { chance: 95, label: "A-Tier Power", kind: "power" },
          { chance: 5, label: "Wending Grace", kind: "special" },
        ],
      },
    ],
  },
  {
    key: "high",
    label: "High-Tier",
    poolLabel: "High Pool",
    accent: "#d9433f",
    powerTierKeys: ["A-Tier"],
    bosses: ["Death Rite Bird", "Black Kindred Blade", "Royal Carian Knight", "Draconic Tree Sentinel"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Random Purple Weapon", kind: "purple" },
          { chance: 35, label: "Class-Specific Purple Weapon", kind: "class-purple" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 85, label: "Random Purple Weapon", kind: "purple" },
          { chance: 15, label: "Random Legendary Weapon", kind: "legendary" },
        ],
      },
      {
        name: "Slot 3 · Dormant Power",
        outcomes: [
          { chance: 95, label: "A-Tier Power", kind: "power" },
          { chance: 5, label: "Wending Grace", kind: "special" },
        ],
      },
    ],
  },
];

export const poiTiers: FieldBossTier[] = [
  {
    key: "poi-low",
    label: "Forts, Cathedrals & Marshes",
    poolLabel: "Forts, Cathedrals & Marshes (Low)",
    accent: "#d9433f",
    powerTierKeys: [],
    bosses: ["Forts", "Cathedrals", "Marshes*"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Class-Specific Blue Weapon", kind: "class-blue" },
          { chance: 35, label: "Blue Weapon", kind: "blue" },
        ],
      },
      { name: "Slot 2", outcomes: [{ chance: 100, label: "Blue Weapon", kind: "blue" }] },
    ],
  },
  {
    key: "poi-mid",
    label: "Ruins, Camps & Blacksmith Villages",
    poolLabel: "Ruins, Camps & Blacksmith Villages (Mid)",
    accent: "#7bb24a",
    powerTierKeys: ["B-Tier"],
    bosses: ["Ruins", "Camps", "Blacksmith Villages*"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Blue Weapon", kind: "blue" },
          { chance: 35, label: "Class-Specific Blue Weapon", kind: "class-blue" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 90, label: "Blue Weapon", kind: "blue" },
          { chance: 10, label: "Purple Weapon", kind: "purple" },
        ],
      },
      { name: "Slot 3 · Dormant Power", outcomes: [{ chance: 100, label: "B-Tier Power", kind: "power" }] },
    ],
    extraInfo: {
      label: "Madness Camp Boss",
      drops: [
        { name: "Vyke's War Spear", chance: 1.67 },
        { name: "Frenzied Flame Seal", chance: 1.67 },
      ],
    },
  },
];

/** Deep of Night "Cursed Red" bosses. */
export const redTiers: FieldBossTier[] = [
  {
    key: "red-low",
    label: "Low-Tier (Red)",
    poolLabel: "Low Tier Red Loot",
    accent: "#e0322e",
    powerTierKeys: ["B-Tier", "S-Tier"],
    bosses: [
      "Red Wolf",
      "Leonine",
      "Golden Hippo",
      "Night's Cavalry",
      "Flying Dragon",
      "Elder Lion",
      "Royal Revenant",
      "Black Knife Assassin",
      "Grafted Scion",
      "Demi-Human Queen",
      "Miranda Blossom",
      "Ancient Hero Zamor",
    ],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 60, label: "Blue Weapon", kind: "blue" },
          { chance: 30, label: "Class-Specific Blue Weapon", kind: "class-blue" },
          { chance: 10, label: "Purple Weapon", kind: "purple" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 85, label: "Red Weapon", kind: "red" },
          { chance: 15, label: "Class-Specific Red Weapon", kind: "class-red" },
        ],
      },
      {
        name: "Slot 3 · Dormant Power",
        outcomes: [
          { chance: 90, label: "B-Tier Power", kind: "power" },
          { chance: 10, label: "S-Tier Power", kind: "power" },
        ],
      },
    ],
  },
  {
    key: "red-mid",
    label: "Mid-Tier (Red)",
    poolLabel: "Mid Tier Red Loot",
    accent: "#e0432e",
    powerTierKeys: ["A-Tier", "S-Tier"],
    bosses: [
      "Erdtree Avatar",
      "Tree Sentinel",
      "Ulcerated Tree Spirit",
      "Flying Dragon",
      "Ancestor Spirit",
      "Magma Wyrm",
      "Red Wolf (Castle)",
      "Royal Revenant (Castle)",
      "Grafted Scion (Castle)",
      "Ancient Zamor (Castle)",
      "Bell Bearing Hunter (Castle)",
      "Leonine (Castle)",
      "Black Knife Assassin (Castle)",
    ],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Red Weapon", kind: "red" },
          { chance: 35, label: "Class-Specific Red Weapon", kind: "class-red" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 55, label: "Red Weapon", kind: "red" },
          { chance: 30, label: "Purple Weapon", kind: "purple" },
          { chance: 15, label: "Legendary Weapon", kind: "legendary" },
        ],
      },
      {
        name: "Slot 3 · Dormant Power",
        outcomes: [
          { chance: 80, label: "A-Tier Power", kind: "power" },
          { chance: 15, label: "S-Tier Power", kind: "power" },
          { chance: 5, label: "Wending Grace", kind: "special" },
        ],
      },
    ],
  },
  {
    key: "red-high",
    label: "High-Tier (Red)",
    poolLabel: "High Tier Red Loot",
    accent: "#b81d1d",
    powerTierKeys: ["A-Tier", "S-Tier"],
    bosses: ["Death Rite Bird", "Black Kindred Blade", "Royal Carian Knight", "Draconic Tree Sentinel"],
    slots: [
      {
        name: "Slot 1",
        outcomes: [
          { chance: 65, label: "Red Weapon", kind: "red" },
          { chance: 35, label: "Class-Specific Red Weapon", kind: "class-red" },
        ],
      },
      {
        name: "Slot 2",
        outcomes: [
          { chance: 75, label: "Red Weapon", kind: "red" },
          { chance: 25, label: "Legendary Weapon", kind: "legendary" },
        ],
      },
      {
        name: "Slot 3 · Dormant Power",
        outcomes: [
          { chance: 80, label: "A-Tier Power", kind: "power" },
          { chance: 15, label: "S-Tier Power", kind: "power" },
          { chance: 5, label: "Wending Grace", kind: "special" },
        ],
      },
    ],
  },
];

export const powerTiers: PowerTier[] = [
  {
    key: "B-Tier",
    label: "B-Tier Powers",
    powers: [
      "Increased Maximum HP",
      "Increased Maximum FP",
      "Reduced FP Consumption",
      "Increased Maximum Stamina",
      "Improved Stamina Recovery",
      "Improved Physical Attack Power",
      "Improved Affinity Attack Power",
      "Improved Stance-Breaking",
      "Improved Physical Damage Negation",
      "Improved Non-Physical Damage Negation",
      "All Resistances Up",
      "Improved Poise",
      "Improved Sorceries & Incantations",
      "Improved Flask HP Restoration",
      "More Runes From Defeated Enemies",
    ],
  },
  {
    key: "A-Tier",
    label: "A-Tier Powers",
    powers: [
      "Increased Sorcery & Incantation Duration",
      "Communion Grants Anti-Dragon Effect",
      "Successful Parries Activate Golden Retaliation",
      "Guard Counters Activate Holy Attacks",
      "Guard Counters Activate Summoning Attack",
      "Improved Thrusting Counterattack",
      "Critical Hit HP Restoration",
      "Critical Hit FP Restoration",
      "Increased Enemy Damage after Critical Hit",
      "HP Recovery upon Successful Guards",
      "FP Recovery upon Successful Guards",
      "Critical Hits Inflict Blood Loss",
      "Creates Holy Ground at Low HP",
      "Poison & Rot Trigger Continuous HP Recovery",
      "Blood Loss in Vicinity Increases Attack Power",
      "Improved Dodging",
      "Gradual Restoration by Flask",
      "Violent Deluge of Star Rain While Walking",
      "Sudden Enemy Death upon Attacks",
      "HP Restoration upon Successive Attacks",
      "FP Restoration upon Successive Attacks",
    ],
  },
  {
    // The source showed page "02" of the S-Tier list — it may be partial.
    key: "S-Tier",
    label: "S-Tier Powers",
    powers: [
      "Increased Maximum HP 2",
      "Increased Maximum FP 2",
      "Reduced FP Consumption 2",
      "Increased Maximum Stamina 2",
      "Increased Stamina Recovery 2",
      "Improved Physical Attack Power 2",
      "Improved Affinity Attack Power 2",
      "Improved Stance-Breaking 2",
      "Improved Physical Damage Negation 2",
      "Improved Affinity Damage Negation 2",
      "All Resistances Up 2",
      "Improved Poise 2",
      "Improved Sorceries & Incantations 2",
      "Improved Ultimate Art Gauge Charge Speed 2",
      "Character Skill Cooldown Reduction",
      "Lightning upon Dodging",
      "Improved Flask HP Restoration",
      "Ice Storm Surge Sprint",
      "Flame of Frenzy While Walking",
      "Periodical Giant Glintblades",
    ],
  },
];
