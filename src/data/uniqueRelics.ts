// ─────────────────────────────────────────────────────────────────────────
//  UNIQUE RELICS  ·  fixed-effect relics with their own look
// ─────────────────────────────────────────────────────────────────────────
//  Boss relics (Nightlord first clears, Everdark Sovereign purchases), the
//  general shop uniques, and each Nightfarer's Remembrance/DLC relics.
//  Effects and colors from the Fextralife wiki; icons in /icons/relics.

export type UniqueRelicColor = "Red" | "Blue" | "Green" | "Yellow";

export const UNIQUE_RELIC_COLOR_HEX: Record<UniqueRelicColor, string> = {
  Red: "#a83b31",
  Blue: "#3e6b9e",
  Green: "#57804f",
  Yellow: "#c9a227",
};

export type UniqueRelicGroup = "nightlord" | "everdark" | "boss" | "shop" | "character";

export interface UniqueRelic {
  name: string;
  color: UniqueRelicColor;
  /** Icon filename under /icons/relics/. */
  icon: string;
  group: UniqueRelicGroup;
  /** Exclusive Nightfarer; omitted = usable by all Nightfarers. */
  character?: string;
  effects: string[];
  /** How it's obtained. */
  source: string;
}

export const UNIQUE_RELIC_CREDIT = "Relic data from the Fextralife Nightreign wiki";

export const uniqueRelics: UniqueRelic[] = [
  // ── Nightlord remembrances (first clear) ─────────────────────────────────
  { name: "Night of the Baron", color: "Blue", icon: "night-of-the-baron.png", group: "nightlord",
    effects: ["Improved Critical Hits +1", "Art gauge fills moderately upon critical hit", "Critical Hit Boosts Stamina Recovery Speed"],
    source: "Defeat Gaping Jaw (first clear)" },
  { name: "Night of the Beast", color: "Green", icon: "night-of-the-beast.png", group: "nightlord",
    effects: ["Stamina recovers with each successful attack +1", "Starting armament deals fire damage"],
    source: "Defeat Gladius, Beast of Night (first clear)" },
  { name: "Night of the Champion", color: "Green", icon: "night-of-the-champion.png", group: "nightlord",
    effects: ["Increased Maximum Stamina", "Guard counter is given a boost based on current HP", "HP Restoration upon Thrusting Counterattack"],
    source: "Defeat Darkdrift Knight (first clear)" },
  { name: "Night of the Demon", color: "Red", icon: "night-of-the-demon.png", group: "nightlord",
    effects: ["Huge rune discount for shop purchases while on expedition", "Gesture “Crossed Legs” Builds Up Madness", "Madness Continually Recovers FP"],
    source: "Defeat Equilibrious Beast (first clear)" },
  { name: "Night of the Fathom", color: "Red", icon: "night-of-the-fathom.png", group: "nightlord",
    effects: ["Increased Maximum HP", "Flask Also Heals Allies", "Items confer effect to all nearby allies"],
    source: "Defeat Augur (first clear)" },
  { name: "Night of the Lord", color: "Blue", icon: "night-of-the-lord.png", group: "nightlord",
    effects: ["Switching Weapons Adds an Affinity Attack", "Boosts Attack Power of Added Affinity Attacks", "Switching Weapons Boosts Attack Power"],
    source: "Defeat Night Aspect (first clear)" },
  { name: "Night of the Miasma", color: "Yellow", icon: "night-of-the-miasma.png", group: "nightlord",
    effects: ["Nearby Frostbite Conceals Self", "Changes compatible armament's skill to Chilling Mist at start of expedition", "Attack power up when facing frostbite-afflicted enemy"],
    source: "Defeat Fissure in the Fog (first clear)" },
  { name: "Night of the Wise", color: "Yellow", icon: "night-of-the-wise.png", group: "nightlord",
    effects: ["Increased Maximum FP", "Starting armament inflicts poison", "Poison & Rot in Vicinity Increases Attack Power"],
    source: "Defeat Sentient Pest (first clear)" },

  // ── Everdark Sovereigns · Collector Signboard ────────────────────────────
  { name: "Dark Night of the Baron", color: "Red", icon: "dark-night-of-the-baron.png", group: "everdark",
    effects: ["Improved Critical Hits +1", "Improved Critical Hits", "Critical Hits Earn Runes"],
    source: "Collector Signboard, after Everdark Gaping Jaw" },
  { name: "Dark Night of the Beast", color: "Yellow", icon: "night-of-the-beast.png", group: "everdark",
    effects: ["Stamina Recovery upon Landing Attacks +1", "Taking attacks improves attack power", "Fire Attack Power Up +2"],
    source: "Collector Signboard, after Everdark Gladius" },
  { name: "Dark Night of the Champion", color: "Yellow", icon: "night-of-the-champion.png", group: "everdark",
    effects: ["Increased Maximum Stamina", "Boosts Attack Power of Added Affinity Attacks", "Defeating enemies fills more of the Art gauge"],
    source: "Collector Signboard, after Everdark Darkdrift Knight" },
  { name: "Dark Night of the Demon", color: "Blue", icon: "night-of-the-demon.png", group: "everdark",
    effects: ["Taking attacks improves attack power", "Gesture “Crossed Legs” Builds Up Madness", "Madness Continually Recovers FP"],
    source: "Collector Signboard, after Everdark Libra" },
  { name: "Dark Night of the Fathom", color: "Blue", icon: "night-of-the-fathom.png", group: "everdark",
    effects: ["Increased Maximum HP", "Continuous HP Recovery", "Slowly restore HP for you and nearby allies at low HP"],
    source: "Collector Signboard, after Everdark Augur" },
  { name: "Dark Night of the Miasma", color: "Green", icon: "night-of-the-miasma.png", group: "everdark",
    effects: ["Frostbite in Vicinity Conceals Self", "Starting armament inflicts frost", "Improved Physical Damage Negation"],
    source: "Collector Signboard, after Everdark Caligo" },
  { name: "Dark Night of the Wise", color: "Green", icon: "night-of-the-wise.png", group: "everdark",
    effects: ["Increased Maximum FP", "FP Restoration upon Successive Attacks", "Max FP permanently increased after releasing Sorcerer's Rise mechanism"],
    source: "Collector Signboard, after Everdark Gnoster" },
  { name: "The Will of Balance", color: "Red", icon: "the-will-of-balance.png", group: "everdark",
    effects: ["Improved Melee Attack Power", "Improved Skill Attack Power", "Occasionally Nullify Attacks When Damage Negation is Lowered"],
    source: "Collector Signboard, after Everdark Harmonia (DLC)" },

  // ── Other bosses ─────────────────────────────────────────────────────────
  { name: "Fell Omen Fetish", color: "Blue", icon: "fell-omen-fetish.png", group: "boss",
    effects: ["Switching Weapons Boosts Attack Power", "Improved Throwing Knife Damage", "Vigor +1"],
    source: "Defeat the Fell Omen (tutorial; replayable from the Visual Codex)" },
  { name: "Old Pocketwatch", color: "Green", icon: "old-pocketwatch.png", group: "boss",
    effects: ["FP Restoration upon Successive Attacks", "Dexterity +3"],
    source: "First Gladius kill or random drop from a failed run; needed to unlock Duchess" },

  // ── General shop uniques ─────────────────────────────────────────────────
  { name: "Besmirched Frame", color: "Blue", icon: "besmirched-frame.png", group: "shop",
    effects: ["Taking attacks improves attack power", "Faith +3"],
    source: "Small Jar Bazaar; triggers the Revenant unlock events" },
  { name: "The Night of Dregs", color: "Red", icon: "the-night-of-dregs.png", group: "shop",
    effects: ["Status Ailment Gauges Slowly Increase Attack Power", "Attacks Inflict Rot when Damage is Taken", "Rot in Vicinity Causes Continuous HP Recovery"],
    source: "Collector Signboard (DLC)" },
  { name: "The Will of the Balancers", color: "Blue", icon: "the-will-of-balance.png", group: "shop",
    effects: ["Improved Melee Attack Power", "Improved Skill Attack Power", "Continuous FP Recovery"],
    source: "Collector Signboard (DLC)" },

  // ── Character relics · Remembrance quests & DLC ──────────────────────────
  // Wylder
  { name: "Slate Whetstone", color: "Red", icon: "slate-whetstone.png", group: "character", character: "Wylder",
    effects: ["[Wylder] Follow-up attacks possible when using Character Skill (greatsword only)", "Physical Attack Up"],
    source: "Wylder Remembrance quest I" },
  { name: "Silver Tear", color: "Red", icon: "silver-tear.png", group: "character", character: "Wylder",
    effects: ["[Wylder] Art gauge greatly filled when ability is activated", "Ultimate Art Gauge +3", "Arcane +3"],
    source: "Wylder Remembrance quest III" },
  { name: "The Wylder's Earring", color: "Red", icon: "the-wylders-earring.png", group: "character", character: "Wylder",
    effects: ["[Wylder] Art activation spreads fire in area", "[Wylder] +1 additional Character Skill use", "Stamina recovers with each successful attack"],
    source: "Wylder's ending — defeat Heolstor with the Silver Tear equipped" },
  // Guardian
  { name: "Stone Stake", color: "Red", icon: "stone-stake.png", group: "character", character: "Guardian",
    effects: ["[Guardian] Increased duration for Character Skill", "Character Skill Cooldown Reduction +3"],
    source: "Guardian Remembrance quest I" },
  { name: "Third Volume", color: "Red", icon: "third-volume.png", group: "character", character: "Guardian",
    effects: ["[Guardian] Creates whirlwind when charging halberd attacks", "HP Restoration upon Halberd Attacks"],
    source: "Guardian Remembrance quest III" },
  { name: "Witch's Brooch", color: "Blue", icon: "witchs-brooch.png", group: "character", character: "Guardian",
    effects: ["[Guardian] Slowly restores nearby allies' HP while Art is active", "[Guardian] Successful guards send out shockwaves while ability is active", "Vigor +3"],
    source: "Guardian final Remembrance quest, sparing the Recluse" },
  { name: "Cracked Witch's Brooch", color: "Blue", icon: "cracked-witchs-brooch.png", group: "character", character: "Guardian",
    effects: ["[Guardian] Slowly restores nearby allies' HP while Art is active", "[Guardian] Successful guards send out shockwaves while ability is active", "Vigor +3"],
    source: "Guardian final Remembrance quest, punishing the Recluse — identical to the Witch's Brooch" },
  // Ironeye
  { name: "Cracked Sealing Wax", color: "Yellow", icon: "cracked-sealing-wax.png", group: "character", character: "Ironeye",
    effects: ["[Ironeye] Extends duration of weak point", "Critical Hits Earn Runes"],
    source: "Ironeye Remembrance quest I" },
  { name: "Edge of Order", color: "Yellow", icon: "edge-of-order.png", group: "character", character: "Ironeye",
    effects: ["[Ironeye] Boosts thrusting counterattacks after executing Art", "Starting armament deals holy damage", "Improved Bow Attack Power"],
    source: "Ironeye Remembrance quest II" },
  // Duchess
  { name: "Golden Dew", color: "Yellow", icon: "golden-dew.png", group: "character", character: "Duchess",
    effects: ["[Duchess] Improved Character Skill Attack Power", "Boosts Attack Power of Added Affinity Attacks"],
    source: "Duchess Remembrance quest I" },
  { name: "Crown Medal", color: "Green", icon: "crown-medal.png", group: "character", character: "Duchess",
    effects: ["[Duchess] Dagger chain attack reprises event upon nearby enemies", "Improved Dagger Attack Power"],
    source: "Duchess Remembrance quest III" },
  { name: "Blessed Iron Coin", color: "Green", icon: "blessed-iron-coin.png", group: "character", character: "Duchess",
    effects: ["[Duchess] Defeating enemies while Art is active ups attack power", "Continuous HP Recovery", "Vigor +3"],
    source: "Duchess final Remembrance quest" },
  // Raider
  { name: "Torn Braided Cord", color: "Blue", icon: "torn-braided-cord.png", group: "character", character: "Raider",
    effects: ["[Raider] Damage taken while using Character Skill improves attack power and stamina", "Strength +3"],
    source: "Raider Remembrance quest I" },
  { name: "Black Claw Necklace", color: "Yellow", icon: "black-claw-necklace.png", group: "character", character: "Raider",
    effects: ["Defeating enemies near Totem Stela restores HP", "Defeating enemies fills more of the Art gauge", "Poise +3"],
    source: "Raider final Remembrance quest" },
  // Revenant
  { name: "Small Makeup Brush", color: "Blue", icon: "small-makeup-brush.png", group: "character", character: "Revenant",
    effects: ["[Revenant] Power up while fighting alongside family", "Increased rune acquisition for self and allies"],
    source: "Revenant Remembrance quest I" },
  { name: "Old Portrait", color: "Blue", icon: "old-portrait.png", group: "character", character: "Revenant",
    effects: ["[Revenant] Trigger ghostflame explosion during Ultimate Art activation", "[Revenant] Expend own HP to fully heal nearby allies when activating Art", "Defeating enemies fills more of the Art gauge"],
    source: "Revenant final Remembrance quest" },
  // Recluse
  { name: "Vestige of Night", color: "Green", icon: "vestige-of-night.png", group: "character", character: "Recluse",
    effects: ["[Recluse] Collecting affinity residue activates Terra Magica", "Magic Attack Power Up +2"],
    source: "Recluse Remembrance quest I" },
  { name: "Bone-Like Stone", color: "Green", icon: "bone-like-stone.png", group: "character", character: "Recluse",
    effects: ["[Recluse] Activating Ultimate Art raises Max HP", "[Recluse] Suffer blood loss and increase attack power upon Art activation", "Intelligence +3"],
    source: "Recluse Remembrance quest III" },
  // Executor
  { name: "Blessed Flowers", color: "Green", icon: "blessed-flowers.png", group: "character", character: "Executor",
    effects: ["[Executor] While Character Skill is active, unlocking use of cursed sword restores HP", "Dexterity +3"],
    source: "Executor Remembrance quest I" },
  { name: "Golden Sprout", color: "Red", icon: "golden-sprout.png", group: "character", character: "Executor",
    effects: ["[Executor] Roaring restores HP while Art is active", "HP Recovery From Successful Guarding", "Slowly restore HP for self and nearby allies when HP is low"],
    source: "Executor final Remembrance quest" },
  // Scholar (DLC)
  { name: "Cleansing Tear", color: "Red", icon: "cleansing-tear.png", group: "character", character: "Scholar",
    effects: ["[Scholar] Continuous damage inflicted on targets threaded by Ultimate Art", "Improved Affinity Damage Negation", "Defeating enemies fills more of the Art gauge"],
    source: "Collector Signboard (DLC)" },
  { name: "Note “My Dear Successor”", color: "Yellow", icon: "note-my-dear-successor.png", group: "character", character: "Scholar",
    effects: ["[Scholar] Allies targeted by Character Skill gain boosted attack", "[Scholar] Prevent slowing of Character Skill progress", "Character Skill Cooldown Reduction +3"],
    source: "Collector Signboard (DLC)" },
  // Undertaker (DLC)
  { name: "Leather Monocle Case", color: "Yellow", icon: "leather-monocle-case.png", group: "character", character: "Undertaker",
    effects: ["[Undertaker] Physical attacks boosted while assist effect from incantation is active for self", "Extend Spell Duration", "Physical Attack Up +2"],
    source: "Collector Signboard (DLC)" },
  { name: "Glass Necklace", color: "Green", icon: "glass-necklace.png", group: "character", character: "Undertaker",
    effects: ["[Undertaker] Activating Ultimate Art increases attack power", "Successive Attacks Boost Attack Power", "Ultimate Art Auto Charge +3"],
    source: "Collector Signboard (DLC)" },
];
