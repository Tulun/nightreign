import type { MerchantSet } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TOWN MAP SETS  ·  your data lives here
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  One entry per "Set" from the reference sheets (Set 0 … Set 20 → 21 total).
 *
 *  Each WeaponEntry: { name, passive, tier, highlighted?, icon? }
 *    - tier: "common" (grey) | "blue" | "purple"  — matches the row colour.
 *    - highlighted: true if the row text was yellow in the source sheet.
 *    - icon: optional, e.g. "/icons/envoys-horn.png" (drop art in /public/icons).
 *
 *  Passives are stored in sentence case; the UI uppercases them for display,
 *  so you can keep editing them in normal case here.
 *
 *  The grid card for a set uses the LAST item in `normalMerchant` as its
 *  icon + label. Clicking a card shows the Special Merchant items (and the
 *  Normal Merchant items below).
 */
export const sets: MerchantSet[] = [
  {
    id: 0,
    specialMerchant: [
      { name: "Ivory Sickle", passive: "Attacks release mist of charm", tier: "blue" },
      { name: "Nagakiba", passive: "Improved skill attack power", tier: "blue" },
      { name: "Celebrant's Skull", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Guardian's Swordspear", passive: "Improved guarding ability", tier: "blue" },
      { name: "Hand Ballista", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Godslayer's Seal", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Distinguished Greatshield", passive: "Improved lightning damage negation", tier: "blue" },
      { name: "Gargoyle's Blackblade", passive: "Attack up when wielding two armaments", tier: "purple", highlighted: true },
      { name: "Serpent Bow", passive: "Improved critical hits", tier: "purple", highlighted: true },
      { name: "Pulley Crossbow", passive: "Improved attack power when two-handing", tier: "purple", highlighted: true },
      { name: "Prince of Death's Staff", passive: "Damage negation up while casting spells", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Club", passive: "Improved damage negation at low HP", tier: "common" },
      { name: "Iron Cleaver", passive: "Defeating enemies restores FP", tier: "blue" },
      { name: "Omen Cleaver", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Partisan", passive: "Attack up when wielding two armaments", tier: "blue", highlighted: true },
      { name: "Carian Glintblade Staff", passive: "Taking damage restores FP", tier: "blue" },
      { name: "Rift Shield", passive: "Successful guarding ups poise", tier: "blue" },
      { name: "Envoy's Horn", passive: "Multiple periodical glintblades", tier: "purple", highlighted: true },
    ],
  },
  {
    id: 1,
    specialMerchant: [
      { name: "Ivory Sickle", passive: "Improved guard breaking", tier: "blue" },
      { name: "Forked Greatsword", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Rusted Anchor", passive: "Attacks call vengeful spirits", tier: "blue" },
      { name: "Harp Bow", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved chain attack finishers", tier: "blue" },
      { name: "Full Moon Crossbow", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Giant's Seal", passive: "Less likely to be targeted", tier: "blue" },
      { name: "Golden Beast Crest Shield", passive: "Improved lightning attack power", tier: "blue" },
      { name: "Rivers of Blood", passive: "HP restoration upon landing attacks", tier: "purple" },
      { name: "Golden Halberd", passive: "Improved guard breaking", tier: "purple" },
      { name: "Azur's Glintstone Staff", passive: "Improved spell casting speed", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Zweihander", passive: "Improved damage negation at full HP", tier: "common" },
      { name: "Nightrider Flail", passive: "Improved guard breaking", tier: "blue" },
      { name: "Highland Axe", passive: "HP restoration upon landing attacks", tier: "blue" },
      { name: "Iron Ball", passive: "Improved damage negation at full HP", tier: "blue" },
      { name: "Staff of the Guilty", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Iron Roundshield", passive: "Improved sorceries", tier: "blue", highlighted: true },
      { name: "Siluria's Tree", passive: "Defeating enemies restore HP", tier: "purple" },
    ],
  },
  {
    id: 2,
    specialMerchant: [
      { name: "Claymore", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Meteoric Ore Blade", passive: "Attacks generate lava", tier: "blue" },
      { name: "Nightrider Glaive", passive: "Attack up when wielding two armaments", tier: "blue", highlighted: true },
      { name: "Composite Bow", passive: "Improved guard breaking", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved magic damage negation", tier: "blue" },
      { name: "Crepus's Black Crossbow", passive: "Improved item discovery", tier: "blue" },
      { name: "Gravel Stone Seal", passive: "Improved lightning attack power", tier: "blue" },
      { name: "Icon Shield", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Scorpion's Stinger", passive: "FP restoration upon landing attacks", tier: "purple" },
      { name: "Prelate's Inferno Crozier", passive: "Improved skill attack power", tier: "purple" },
      { name: "Lusat Glintstone Staff", passive: "Improved sorceries", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Lance", passive: "Improved attack power when two-handing", tier: "common", highlighted: true },
      { name: "Troll's Golden Sword", passive: "Improved guard breaking", tier: "blue" },
      { name: "Godskin Stitcher", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Shamshir", passive: "Improved jump attacks", tier: "blue", highlighted: true },
      { name: "Staff of Loss", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Gilded Iron Shield", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Magma Blade", passive: "Improved lightning damage negation", tier: "purple" },
    ],
  },
  {
    id: 3,
    specialMerchant: [
      { name: "Misericorde", passive: "Improved guard breaking", tier: "blue" },
      { name: "Flamberge", passive: "Improved critical hits", tier: "blue", highlighted: true },
      { name: "Meteoric Ore Blade", passive: "Attack summons wraiths", tier: "blue" },
      { name: "Pest's Glaive", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved jump attacks", tier: "blue", highlighted: true },
      { name: "Clawmark Seal", passive: "Damage negation up while casting spells", tier: "blue" },
      { name: "Spiked Palisade Shield", passive: "Improved magic damage negation", tier: "blue" },
      { name: "Butchering Knife", passive: "Improved guard counters", tier: "purple" },
      { name: "Erdtree Bow", passive: "Improved ranged weapon attacks", tier: "purple", highlighted: true },
      { name: "Pulley Crossbow", passive: "Improved charge attacks", tier: "purple", highlighted: true },
      { name: "Meteorite Staff", passive: "Reduced spell FP cost", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Longsword", passive: "Improved holy damage negation", tier: "common" },
      { name: "Chainlink Flail", passive: "Improved guard breaking", tier: "blue" },
      { name: "Grossmesser", passive: "Improved skill attack power", tier: "blue" },
      { name: "Bloodhound Claws", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Godslayer's Seal", passive: "Improved spell casting speed", tier: "blue", highlighted: true },
      // The bottom two rows sat behind the video scrubber — tiers inferred from
      // the usual layout (last item = purple). Adjust if the capture differs.
      { name: "Ice Crest Shield", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Scepter of the All-Knowing", passive: "Improved attack power when two-handing", tier: "purple", highlighted: true },
    ],
  },

  {
    id: 4,
    specialMerchant: [
      { name: "Erdsteel Dagger", passive: "Wraiths while walking", tier: "blue", highlighted: true },
      { name: "Serpentbone Blade", passive: "Improved lightning attack power", tier: "blue" },
      { name: "Giant-Crusher", passive: "Improved fire attack power", tier: "blue" },
      { name: "Horn Bow", passive: "Successful guarding ups poise", tier: "blue" },
      { name: "Crepus's Black Crossbow", passive: "Improved skill attack power", tier: "blue" },
      { name: "Hand Ballista", passive: "Improved lightning damage negation", tier: "blue" },
      { name: "Clawmark Seal", passive: "Improved damage negation at low HP", tier: "blue" },
      { name: "Redmane Greatshield", passive: "Improved madness resistance", tier: "blue" },
      { name: "Death's Poker", passive: "Reduced skill FP cost", tier: "purple" },
      { name: "Dragon Halberd", passive: "Improved jump attacks", tier: "purple", highlighted: true },
      { name: "Lusat's Glintstone Staff", passive: "Less likely to be targeted", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Falchion", passive: "Improved lightning damage negation", tier: "common" },
      { name: "Beastman's Cleaver", passive: "Improved magic attack power", tier: "blue" },
      { name: "Iron Cleaver", passive: "Improved rot resistance", tier: "blue" },
      { name: "Pike", passive: "Attack up when wielding two armaments", tier: "blue", highlighted: true },
      { name: "Gravel Stone Seal", passive: "Damage negation up while casting spells", tier: "blue" },
      { name: "Man-Serpent's Shield", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Sword of St. Trina", passive: "Reduced skill FP cost", tier: "purple" },
    ],
  },
  {
    id: 5,
    specialMerchant: [
      { name: "Forked Greatsword", passive: "Damage negation up upon landing attacks", tier: "blue" },
      { name: "Nagakiba", passive: "Improved charged attacks", tier: "blue", highlighted: true },
      { name: "Nightrider Glaive", passive: "Attacks release mist of frost", tier: "blue" },
      { name: "Composite Bow", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved attack power at full HP", tier: "blue", highlighted: true },
      { name: "Hand Ballista", passive: "Taking damage boosts damage negation", tier: "blue" },
      { name: "Giant's Seal", passive: "Improved fire attack power", tier: "blue" },
      { name: "Eclipse Crest Greatshield", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Glintstone Kris", passive: "Attack up when wielding two armaments", tier: "purple", highlighted: true },
      { name: "Beastclaw Greathammer", passive: "Fire attacks follows charge attacks that land", tier: "purple", highlighted: true },
      { name: "Prince of Death's Staff", passive: "Continuous HP recovery", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Twinblade", passive: "Improved magic damage negation", tier: "common" },
      { name: "Mace", passive: "Improved damage negation at low HP", tier: "common" },
      { name: "Celebrant's Cleaver", passive: "Improved charged attacks", tier: "blue", highlighted: true },
      { name: "Grave Scythe", passive: "Improved fire attack power", tier: "blue" },
      { name: "Venomous Fang", passive: "Successful guarding ups damage negation", tier: "blue" },
      { name: "Iron Roundshield", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Ornamental Straight Sword", passive: "Improved guard breaking", tier: "purple" },
    ],
  },
  {
    id: 6,
    specialMerchant: [
      { name: "Erdsteel Dagger", passive: "Fire attacks follows charge attacks that land", tier: "blue", highlighted: true },
      { name: "Gargoyle's Greatsword", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Great Omenkiller Cleaver", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Ripple Crescent Halberd", passive: "Improved skill attack power", tier: "blue" },
      { name: "Full Moon Crossbow", passive: "Improved attack power at full HP", tier: "blue", highlighted: true },
      { name: "Hand Ballista", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Godslayer's Seal", passive: "Defeating enemies restore HP", tier: "blue" },
      { name: "Cuckoo Greatshield", passive: "Magma surge sprint", tier: "blue" },
      { name: "Moonveil", passive: "Improved magic damage negation", tier: "purple" },
      { name: "Black Bow", passive: "Taking damage boosts damage negation", tier: "purple" },
      { name: "Azur's Glintstone Staff", passive: "Improved magic attack power", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Dismounter", passive: "Improved fire damage negation", tier: "common" },
      { name: "Lordsworn's Straight Sword", passive: "Improved holy damage negation", tier: "blue" },
      { name: "Chainlink Flail", passive: "Improved poison resistance", tier: "blue" },
      { name: "Warped Axe", passive: "Improved lightning attack power", tier: "blue" },
      { name: "Treespear", passive: "Improved magic damage negation", tier: "blue" },
      { name: "Gilded Iron Shield", passive: "Multiple periodical glintblades", tier: "blue", highlighted: true },
      { name: "Bloody Helice", passive: "Lightning follows charge attacks that land", tier: "purple", highlighted: true },
    ],
  },
  {
    id: 7,
    specialMerchant: [
      { name: "Misericorde", passive: "Improved critical hits", tier: "blue", highlighted: true },
      { name: "Banished Knight Greatsword", passive: "Improved damage negation at low HP", tier: "blue" },
      { name: "Meteoric Ore Blade", passive: "Improved attack power at full HP", tier: "blue", highlighted: true },
      { name: "Pest's Glaive", passive: "Continuous HP recovery", tier: "blue" },
      { name: "Full Moon Crossbow", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Hand Ballista", passive: "Multiple periodical glintblades", tier: "blue", highlighted: true },
      { name: "Crystal Staff", passive: "Improved charged sorceries", tier: "blue" },
      { name: "Golden Greatshield", passive: "Savage pillars of flame rise while walking", tier: "blue", highlighted: true },
      { name: "Gargoyle's Black Axe", passive: "Holy attacks follows charge attacks that land", tier: "purple", highlighted: true },
      { name: "Pulley Bow", passive: "Reduced skill FP cost", tier: "purple" },
      { name: "Golden Order Seal", passive: "Improved ranged weapon attacks", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Bandit's Curved Sword", passive: "Improved poison resistance", tier: "common" },
      { name: "Torchpole", passive: "Frostbite produces a mist of frost", tier: "blue" },
      { name: "Watchdog's Greatsword", passive: "Defeating enemies restores FP", tier: "blue" },
      { name: "Spiked Caestus", passive: "Improved guard breaking", tier: "blue" },
      { name: "Carian Glintstone Staff", passive: "Improved magic damage negation", tier: "blue" },
      { name: "Kite Shield", passive: "Improved guarding ability", tier: "blue" },
      { name: "Icerind Hatchet", passive: "Improved magic attack power", tier: "purple", highlighted: true },
    ],
  },
  {
    id: 8,
    specialMerchant: [
      { name: "Wakizashi", passive: "Less likely to be targeted", tier: "blue" },
      { name: "Forked Greatsword", passive: "Attack up when wielding two armaments", tier: "blue", highlighted: true },
      { name: "Ripple Crescent Halberd", passive: "Taking damage restores FP", tier: "blue" },
      { name: "Harp Bow", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Golem Greatbow", passive: "Improved skill attack power", tier: "blue" },
      { name: "Full Moon Crossbow", passive: "Improved ranged weapon attacks", tier: "blue", highlighted: true },
      { name: "Gelmir Glintstone Staff", passive: "Magma surge sprint", tier: "blue" },
      { name: "Gilded Greatshield", passive: "Improved blood loss resistance", tier: "blue" },
      { name: "Dragonscale Blade", passive: "Improved skill attack power", tier: "purple" },
      { name: "Staff of the Avatar", passive: "Defeating enemies restores HP", tier: "purple" },
      { name: "Frenzied Flame Seal", passive: "Improved attack power at full HP", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Hand Axe", passive: "Improved sleep resistance", tier: "common" },
      { name: "Scavenger's Curved Sword", passive: "Rot produces a mist of scarlet rot", tier: "blue" },
      { name: "Hammer", passive: "Improved critical hits", tier: "blue", highlighted: true },
      { name: "Torchpole", passive: "Improved jump attacks", tier: "blue", highlighted: true },
      { name: "Albinauric Staff", passive: "Improved magic attack power", tier: "blue", highlighted: true },
      { name: "Sun Realm Shield", passive: "Improved damage negation at full HP", tier: "blue" },
      { name: "Winged Scythe", passive: "Improved holy attack power", tier: "purple" },
    ],
  },
  {
    id: 9,
    specialMerchant: [
      { name: "Knight's Greatsword", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Meteoric Ore Blade", passive: "Improved skill attack power", tier: "blue" },
      { name: "Troll's Hammer", passive: "Improved fire damage negation", tier: "blue" },
      { name: "Pest's Glaive", passive: "Improved attack power at full HP", tier: "blue", highlighted: true },
      { name: "Golem Greatbow", passive: "Improved damage negation at low HP", tier: "blue" },
      { name: "Crepus's Black Crossbow", passive: "Less likely to be targeted", tier: "blue" },
      { name: "Carian Glintblade Staff", passive: "Improved magic attack power", tier: "blue", highlighted: true },
      { name: "Haligtree Crest Greatshield", passive: "Storm of red lightning while walking", tier: "blue", highlighted: true },
      { name: "Cinquedea", passive: "Magic attack follows charge attacks that land", tier: "purple", highlighted: true },
      { name: "Serpent Bow", passive: "Improved fire attack power", tier: "purple" },
      { name: "Dragon Communion Seal", passive: "Improved attack power at full HP", tier: "purple", highlighted: true },
    ],
    normalMerchant: [
      { name: "Great Épée", passive: "Improved blood loss resistance", tier: "common" },
      { name: "Omen Cleaver", passive: "Improved charge attacks", tier: "blue", highlighted: true },
      { name: "Godskin Peeler", passive: "Damage negation up upon landing charged attacks", tier: "blue" },
      { name: "Urumi", passive: "Improved chain attack finishers", tier: "blue" },
      { name: "Clawmark Seal", passive: "Improved skill attack power", tier: "blue" },
      { name: "Scorpion Kite Shield", passive: "Continuous HP recovery", tier: "blue" },
      { name: "Halo Scythe", passive: "Improved attack power when two-handing", tier: "purple", highlighted: true },
    ],
  },
  {
    id: 10,
    specialMerchant: [
      { name: "Meteoric Ore Blade", passive: "Improved magic attack power", tier: "blue", highlighted: true },
      { name: "Rotten Battle Hammer", passive: "Improved guard breaking", tier: "blue" },
      { name: "Guardian's Swordspear", passive: "Attacks unleash lightning", tier: "blue" },
      { name: "Harp Bow", passive: "Improved attack power when two-handing", tier: "blue", highlighted: true },
      { name: "Golem Greatbow", passive: "Improved ranged weapon attacks", tier: "blue", highlighted: true },
      { name: "Albinauric Staff", passive: "Defeating enemies restores HP", tier: "blue" },
      { name: "Briar Greatshield", passive: "Improved sorceries", tier: "blue", highlighted: true },
      { name: "Black Knife", passive: "Improved charge attacks", tier: "purple", highlighted: true },
      { name: "Alabaster Lord's Sword", passive: "Improved madness resistance", tier: "purple" },
      { name: "Jar Cannon", passive: "Improved ranged weapon attacks", tier: "purple", highlighted: true },
      { name: "Golden Order Seal", passive: "Less likely to be targeted", tier: "purple" },
    ],
    normalMerchant: [
      { name: "Caestus", passive: "Improved rot resistance", tier: "common" },
      { name: "Beastman's Cleaver", passive: "Improved attack power at low HP", tier: "blue" },
      { name: "Twinned Knight Swords", passive: "Reduced skill FP cost", tier: "blue" },
      { name: "Morning Star", passive: "Taking damage boosts damage negation", tier: "blue" },
      { name: "Giant's Seal", passive: "Improved fire attack power", tier: "blue" },
      { name: "Twinbird Kite Shield", passive: "Improved holy attack power", tier: "blue" },
      { name: "Royal Greatsword", passive: "Defeating enemies restores FP", tier: "purple", highlighted: true },
    ],
  },

  // ── Placeholders for Sets 11–20. Fill these in as you send each sheet. ───
  ...Array.from({ length: 10 }, (_, i): MerchantSet => ({
    id: i + 11,
    specialMerchant: [],
    normalMerchant: [],
  })),
];

/** Look up a single set by id. Returns undefined if out of range. */
export function getSet(id: number): MerchantSet | undefined {
  return sets.find((s) => s.id === id);
}
