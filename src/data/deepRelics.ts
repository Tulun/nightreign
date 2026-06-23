import type { DeepRelic } from "@/lib/relics";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  DEEP RELIC EFFECTS
 * ─────────────────────────────────────────────────────────────────────────
 *  The richer Deep-relic pool: full effect text, stack behavior, and notes,
 *  plus Character stat-swaps and Curse drawbacks. From the community sheet.
 *  stack "tiers" = only different tiers stack (e.g. +1 with +2, not +1 with +1).
 */
export const deepRelics: DeepRelic[] = [
  // ── Stat ────────────────────────────────────────────────────────────────
  { name: "Increased Maximum HP", effect: "Increases maximum HP by 1.1x", category: "stat", stack: "yes" },
  { name: "Increased Maximum FP", effect: "Increases maximum FP by 1.15x", category: "stat", stack: "yes" },
  { name: "Increased Maximum Stamina", effect: "Increases maximum stamina by 1.12x", category: "stat", stack: "yes" },

  // ── Start of Game ─────────────────────────────────────────────────────────
  { name: "[Item] in possession at start of expedition", effect: "Start the expedition with the specified item", category: "start", stack: "yes", note: "List covers all crystal tears and perfume items." },

  // ── Exploration ───────────────────────────────────────────────────────────
  { name: "Max HP increased per Great Church boss", effect: "+1.05x maximum HP for each great enemy killed at a Great Church", category: "exploration", stack: "no" },
  { name: "Runes & Discovery increased per Fort boss", effect: "+16 discovery and +1.055x rune gain for each great enemy killed at a Fort", category: "exploration", stack: "no" },
  { name: "Arcane increased per Ruin boss", effect: "+4 arcane for each great enemy killed at a Ruin", category: "exploration", stack: "no" },
  { name: "Max Stamina increased per Great Encampment boss", effect: "+1.075x maximum stamina for each great enemy killed at a Camp", category: "exploration", stack: "no" },
  { name: "Dormant Power Helps Discover [Weapon Class]", effect: "Changes your preferred weapon class to the specified one, making it more likely to drop", category: "exploration", stack: "no", note: "Priority goes to the first in order. Does not stack with the character's preferred weapon type." },

  // ── Offensive ─────────────────────────────────────────────────────────────
  { name: "Physical Attack Up +3/4", effect: "Increases physical damage by 1.105x / 1.12x", category: "offensive", stack: "yes" },
  { name: "Magic/Fire/Lightning/Holy Attack Up +3/4", effect: "Increases the respective element's damage by 1.105x / 1.12x", category: "offensive", stack: "yes" },
  { name: "Improved Affinity Attack Power +0/1/2", effect: "Increases magic, fire, lightning & holy damage by 1.05x / 1.08x / 1.1x", category: "offensive", stack: "yes", note: "Affects spells." },
  { name: "Attack Power Up After Using Grease +1/2", effect: "Increases physical damage by 1.17x / 1.2x for 30s after using a grease item", category: "offensive", stack: "tiers" },
  { name: "Attack Power Up vs Poison/Rot/Frost-Afflicted Enemy +1/2", effect: "Increases damage by 1.16x / 1.2x against enemies suffering the specified status", category: "offensive", stack: "tiers" },
  { name: "Sleep/Madness in Vicinity Improves Attack Power +0/1", effect: "Increases damage by 1.12x / 1.22x after a nearby sleep/madness proc", category: "offensive", stack: "tiers" },
  { name: "Improved Guard Counters +1/2", effect: "Increases guard counter damage by 1.25x / 1.29x", category: "offensive", stack: "yes" },
  { name: "Improved [Consumable] Damage +1/2", effect: "Increases pot/knife/stone/perfume damage by 1.3x / 1.35x", category: "offensive", stack: "yes" },
  { name: "Art Gauge Charged from Successful Guarding +1", effect: "+1.5 character-skill gauge on blocking an attack", category: "offensive", stack: "tiers" },
  { name: "Art Gauge Fills Moderately upon Critical Hit +1", effect: "+6.5 character-skill gauge on a riposte", category: "offensive", stack: "tiers" },
  { name: "Defeating Enemies Fills More Art Gauge +1", effect: "+6.5 character-skill gauge on killing enemies", category: "offensive", stack: "tiers" },
  { name: "Improved Sorceries/Incantations +0/1/2", effect: "Increases sorcery/incantation damage by 1.05x / 1.085x / 1.1x", category: "offensive", stack: "yes" },
  { name: "Reduced FP Consumption +0/1/2", effect: "Reduces FP consumption by 0.92x / 0.87x / 0.84x", category: "offensive", stack: "yes", note: "Higher tiers (+1/+2) don't seem to roll on random relics." },

  // ── Defensive ─────────────────────────────────────────────────────────────
  { name: "Improved Physical Damage Negation +1/2", effect: "Increases physical damage negation by 10.5% / 12%", category: "defensive", stack: "yes" },
  { name: "Improved [Element] Damage Negation +1/2", effect: "Increases the respective element's damage negation by 15% / 16%", category: "defensive", stack: "yes" },
  { name: "Improved Affinity Damage Negation +0/1/2", effect: "Increases magic, fire, lightning & holy damage negation by 6% / 10.5% / 12%", category: "defensive", stack: "yes" },
  { name: "Improved [Status] Resistance +1/2", effect: "Increases the specified status resistance by 110 / 130", category: "defensive", stack: "yes" },

  // ── Regen ───────────────────────────────────────────────────────────────
  { name: "Partial HP Restoration upon Post-Damage Attacks +1/2", effect: "As the base effect, but increases HP gained per hit by 25% / 35%", category: "regen", stack: "tiers", note: "+1 stacks with +2, but neither stacks with +0." },
  { name: "HP Restoration upon Thrusting Counterattack +1", effect: "Restores 3.3% of max HP on counterhits", category: "regen", stack: "tiers" },
  { name: "HP Restored When Using Medicinal Boluses, etc. +1", effect: "Replenishes 80 HP from certain consumables", category: "regen", stack: "tiers" },
  { name: "Improved Flask HP Restoration", effect: "Increases HP gained from flasks by 1.1x", category: "regen", stack: "yes" },

  // ── Character (skills & stat-swaps) ─────────────────────────────────────────
  { name: "[Wylder] Character Skill Inflicts Blood Loss", effect: "Skill inflicts 60 (impact) / 55 (pull) bleed on hit", category: "character", stack: "no" },
  { name: "[Guardian] Skill Boosts Damage Negation of Nearby Allies", effect: "+12% damage negation for self and allies for 30s after using the skill", category: "character", stack: "no" },
  { name: "[Ironeye] Skill Inflicts Heavy Poison Damage on Poisoned Enemies", effect: "Skill inflicts 70 poison; deals 0.25% max HP + 250 to poison-afflicted enemies", category: "character", stack: "no", note: "Testing suggests it's still based on max HP." },
  { name: "[Duchess] Use Character Skill for Brief Invulnerability", effect: "Immune to damage for 0.4s after using the skill", category: "character", stack: "no", note: "≈24 iframes at 60 FPS." },
  { name: "[Raider] Hit With Skill to Reduce Enemy Attack Power", effect: "Enemies hit by the skill deal 0.87x damage for 13s", category: "character", stack: "no" },
  { name: "[Revenant] Increases Max FP upon Ability Activation", effect: "Permanently +1.0075x max FP (0–20 stacks), +1.0085x (21–40), +1.0095x (41–60). Cap: +51% max FP", category: "character", stack: "no" },
  { name: "[Recluse] Collect Affinity Residues to Negate Affinity", effect: "+20% magic/fire/lightning/holy negation for 30s on absorbing the matching residue", category: "character", stack: "no" },
  { name: "[Executor] Slowly Restore HP upon Ability Activation", effect: "Restores 0.27% max HP + 3 for 30s after the passive activates (recovering from a status)", category: "character", stack: "no" },
  { name: "[Scholar] Reduced FP Consumption When Using Skill on Self", effect: "0.85x FP consumption for 40s after a self-buff character skill", category: "character", stack: "no" },
  { name: "[Undertaker] Executing Art Readies Character Skill", effect: "Lets you perform Trance immediately after an ultimate. Works with temporary ultimate use", category: "character", stack: "no" },
  { name: "[Wylder] Improved Mind, Reduced Vigor", effect: "−5 vigor, +10 mind", category: "character", stack: "no", note: "At level 15: −100 HP, +50 FP. (Stat deltas below assume level 15.)" },
  { name: "[Wylder] Improved Intelligence & Faith, Reduced Strength & Dexterity", effect: "−7 strength, −5 dexterity, +15 intelligence & faith", category: "character", stack: "no" },
  { name: "[Guardian] Improved Strength & Dexterity, Reduced Vigor", effect: "−8 vigor, +9 strength, +19 dexterity", category: "character", stack: "no", note: "≈16% AP for halberds, ≈20% for heavy thrusting swords; −160 HP." },
  { name: "[Guardian] Improved Mind & Faith, Reduced Vigor", effect: "−6 vigor, +8 mind, +17 faith", category: "character", stack: "no", note: "−120 HP, +40 FP." },
  { name: "[Ironeye] Improved Arcane, Reduced Dexterity", effect: "−9 dexterity, +15 arcane", category: "character", stack: "no", note: "≈26% more status buildup, ≈6% less bow AP." },
  { name: "[Ironeye] Improved Vigor & Strength, Reduced Dexterity", effect: "−13 dexterity, +20 strength, +5 vigor", category: "character", stack: "no", note: "+100 HP." },
  { name: "[Duchess] Improved Vigor & Strength, Reduced Mind", effect: "−14 mind, +24 strength, +3 vigor", category: "character", stack: "no", note: "−70 FP, +60 HP." },
  { name: "[Duchess] Improved Mind & Faith, Reduced Intelligence", effect: "−5 intelligence, +13 faith, +3 mind", category: "character", stack: "no", note: "+15 FP; ≈14% more incantation damage vs base Duchess (still 10% under Revenant)." },
  { name: "[Raider] Improved Mind & Intelligence, Reduced Vigor & Endurance", effect: "−8 vigor, −4 endurance, +35 intelligence, +9 mind", category: "character", stack: "no", note: "−160 HP, +45 FP." },
  { name: "[Raider] Improved Arcane, Reduced Vigor", effect: "−4 vigor, +17 arcane", category: "character", stack: "no", note: "−80 HP." },
  { name: "[Revenant] Improved Vigor & Endurance, Reduced Mind", effect: "−11 mind, +5 vigor, +5 endurance", category: "character", stack: "no", note: "−55 FP, +100 HP." },
  { name: "[Revenant] Improved Strength, Reduced Faith", effect: "−6 faith, +25 strength", category: "character", stack: "no" },
  { name: "[Recluse] Improved Vigor, Endurance & Dexterity, Reduced Intelligence & Faith", effect: "−10 intelligence & faith, +20 dexterity, +5 endurance, +4 vigor", category: "character", stack: "no", note: "+80 HP." },
  { name: "[Recluse] Improved Intelligence & Faith, Reduced Mind", effect: "−13 mind, +12 intelligence & faith", category: "character", stack: "no", note: "−65 FP, ≈10% more spell damage." },
  { name: "[Executor] Improved Vigor & Endurance, Reduced Arcane", effect: "−13 arcane, +5 vigor, +6 endurance", category: "character", stack: "no", note: "+100 HP." },
  { name: "[Executor] Improved Dexterity & Arcane, Reduced Vigor", effect: "−7 vigor, +9 arcane, +12 dexterity", category: "character", stack: "no", note: "−140 HP, ≈11% more status buildup, ≈6.3% more katana AP." },
  { name: "[Scholar] Improved Mind, Reduced Vigor", effect: "−6 vigor, +6 mind", category: "character", stack: "no" },
  { name: "[Scholar] Improved Endurance & Dexterity, Reduced Intelligence & Arcane", effect: "−4 intelligence, −20 arcane, +3 endurance, +37 dexterity", category: "character", stack: "no" },
  { name: "[Undertaker] Improved Dexterity, Reduced Vigor & Faith", effect: "−5 vigor, −13 faith, +19 dexterity", category: "character", stack: "no" },
  { name: "[Undertaker] Improved Mind & Faith, Reduced Strength", effect: "−15 strength, +6 mind, +9 faith", category: "character", stack: "no" },

  // ── Curse (drawbacks) ─────────────────────────────────────────────────────
  { name: "Taking Damage Causes [Status] Buildup", effect: "Taking damage inflicts 32 (deathblight) / 40 (madness, sleep) / 44 (bleed, rot, frost) / 52 (poison) buildup on you", category: "curse", stack: "yes", note: "Poison/Rot/Frost won't trigger Executor's Tenacity until the status is cured." },
  { name: "Reduced Strength & Intelligence", effect: "−3 strength and intelligence", category: "curse", stack: "yes" },
  { name: "Reduced Dexterity & Faith", effect: "−3 dexterity and faith", category: "curse", stack: "yes" },
  { name: "Reduced Dexterity & Intelligence", effect: "−3 dexterity and intelligence", category: "curse", stack: "yes" },
  { name: "Reduced Strength & Faith", effect: "−3 strength and faith", category: "curse", stack: "yes" },
  { name: "Reduced Vigor & Arcane", effect: "−3 vigor and arcane", category: "curse", stack: "yes", note: "−60 HP." },
  { name: "Reduced Rune Acquisition", effect: "−0.9x rune gain", category: "curse", stack: "yes" },
  { name: "Reduced Flask HP Restoration", effect: "−0.85x HP gained from flasks", category: "curse", stack: "yes" },
  { name: "Ultimate Art Charging Impaired", effect: "−0.85x ultimate-gauge gain", category: "curse", stack: "yes", note: "Unlike Ultimate Art Gauge, affects both passive gain and gain from attacking." },
  { name: "All Resistances Down", effect: "−80 to all status resistance", category: "curse", stack: "yes" },
  { name: "Continuous HP Loss", effect: "Lose 2 HP per second", category: "curse", stack: "yes" },
  { name: "More Damage Taken After Evasion", effect: "−45% damage negation right after rolling", category: "curse", stack: "yes" },
  { name: "Repeated Evasions Lower Damage Negation", effect: "−23% / 35% damage negation for 15s on repeated rolls", category: "curse", stack: "yes" },
  { name: "Reduced Damage Negation for Flask Usages", effect: "−45% damage negation while using a flask", category: "curse", stack: "yes" },
  { name: "Lower Attack When Below Max HP", effect: "−0.915x damage when HP is below 85%", category: "curse", stack: "yes" },
  { name: "Poison Buildup When Below Max HP", effect: "+2 poison buildup every 0.22s when HP is below 85%", category: "curse", stack: "yes", note: "Won't trigger Executor's Tenacity until cured." },
  { name: "Rot Buildup When Below Max HP", effect: "+2 rot buildup every 0.24s when HP is below 85%", category: "curse", stack: "yes", note: "Won't trigger Executor's Tenacity until cured." },
  { name: "Near Death Reduces Max HP", effect: "−0.75x maximum HP for 60s after being downed", category: "curse", stack: "yes" },

  // ── Normal-pool effects that also roll on Deep relics (crossover: true) ──────
  // Filed into their natural categories; the "Normal + Deep" badge marks them.
  // Offensive
  { name: "Physical Attack Up +2", effect: "+6% physical damage", category: "offensive", stack: "yes", crossover: true, note: "Only the +2 normal tier rolls on Deep — not +0 or +1." },
  { name: "Magic/Fire/Lightning/Holy Attack Up +2", effect: "+6.5% of the respective element's damage", category: "offensive", stack: "yes", crossover: true, note: "Only the +2 normal tier rolls on Deep — not +0 or +1." },
  { name: "Attack Power Up After Using Grease +0", effect: "+10% physical damage for 30s after using a grease item", category: "offensive", stack: "tiers", crossover: true },
  { name: "Attack Power Up vs Frost/Poison/Rot-Afflicted Enemy +0", effect: "+10% damage against enemies suffering the specified status", category: "offensive", stack: "tiers", crossover: true },
  { name: "Improved Guard Counters +0", effect: "+17% guard counter damage", category: "offensive", stack: "tiers", crossover: true },
  { name: "Improved [Consumable] Damage +0", effect: "+15% pot/knife/stone/perfume damage", category: "offensive", stack: "tiers", crossover: true },
  { name: "Improved [Spell School] Sorcery/Incantation", effect: "+12% damage of the specified school (e.g. Giants' Flame Incantations, Carian Sword Sorcery)", category: "offensive", stack: "no", crossover: true },
  { name: "Improved [Weapon] Attack Power", effect: "+9% (+6% for bows) damage with that weapon type", category: "offensive", stack: "yes", crossover: true },
  { name: "Improved Attack Power with 3+ [Weapon] Equipped", effect: "+20% (+10% for bows) when 3+ of that weapon type are equipped", category: "offensive", stack: "no", crossover: true },
  { name: "Improved Critical Hits", effect: "+18% critical hit damage", category: "offensive", stack: "yes", crossover: true },
  { name: "Improved Initial Standard Attack", effect: "+15% on the first light attack of a chain", category: "offensive", stack: "yes", crossover: true },
  { name: "Guard Counter Boosted by Current HP", effect: "Adds a flat hit (≈ current HP ÷ 20) to each guard counter", category: "offensive", stack: "no", crossover: true },
  { name: "Art Gauge Charged from Successful Guarding +0", effect: "+1 Ultimate gauge on blocking an attack", category: "offensive", stack: "tiers", crossover: true },
  { name: "Art Gauge Fills Moderately upon Critical Hit +0", effect: "+5 Ultimate gauge on a critical hit", category: "offensive", stack: "tiers", crossover: true },
  { name: "Defeating Enemies Fills More Art Gauge +0", effect: "+5 Ultimate gauge per enemy kill", category: "offensive", stack: "tiers", crossover: true },
  // Defensive
  { name: "Improved Physical Damage Negation +0", effect: "+10% physical damage negation", category: "defensive", stack: "tiers", crossover: true },
  { name: "Improved [Element] Damage Negation +0", effect: "+10% of the respective element's damage negation", category: "defensive", stack: "tiers", crossover: true },
  { name: "Improved [Status] Resistance +0", effect: "+75 of the specified status resistance", category: "defensive", stack: "tiers", crossover: true },
  { name: "Improved Damage Negation at Low HP", effect: "+16% damage negation when HP is below 40%", category: "defensive", stack: "yes", crossover: true },
  { name: "Improved Poise & Damage Negation When Knocked Back by Damage", effect: "+20% negation & −20% poise damage for 20s after being knocked back", category: "defensive", stack: "no", crossover: true },
  { name: "Draw Enemy Attention While Guarding", effect: "Increases enemy aggro while holding block", category: "defensive", stack: "no", crossover: true },
  // Stat
  { name: "Poise +3", effect: "−15% poise damage taken", category: "stat", stack: "yes", crossover: true },
  { name: "Max FP Up with 3+ Staves/Seals Equipped", effect: "+50 Max FP", category: "stat", stack: "no", crossover: true },
  { name: "Max HP Up with 3+ Shields Equipped", effect: "+200 Max HP", category: "stat", stack: "no", crossover: true },
  // Regen
  { name: "Partial HP Restoration upon Post-Damage Attacks +0", effect: "Replenishes HP on hit for a short time after taking damage", category: "regen", stack: "no", crossover: true, note: "Does not stack with the Deep +1/+2 versions." },
  { name: "HP Restoration upon Thrusting Counterattack +0", effect: "Restores ~2.5% of max HP on counterhits", category: "regen", stack: "tiers", crossover: true },
  { name: "HP Restored When Using Medicinal Boluses, etc. +0", effect: "Replenishes 50 HP from certain consumables", category: "regen", stack: "tiers", crossover: true },
  { name: "Critical Hit Boosts Stamina Recovery Speed +0", effect: "+10 stamina/s for 15s after a critical hit", category: "regen", stack: "tiers", crossover: true },
  { name: "Slowly Restore HP for Self & Nearby Allies When HP Is Low", effect: "+0.5% max HP + 1 HP/s for 50s while below 20% HP", category: "regen", stack: "no", crossover: true },
  { name: "Raised Stamina Recovery for Nearby Allies, but Not for Self", effect: "+4 stamina/s for nearby allies", category: "regen", stack: "no", crossover: true },
  { name: "Defeating Enemies Restores HP for Allies but Not for Self", effect: "Allies recover 20 HP per enemy kill", category: "regen", stack: "no", crossover: true },
  { name: "HP Restoration upon [Weapon] Attacks", effect: "Restores ~15 HP per hit (same for every weapon type)", category: "regen", stack: "no", crossover: true },
  { name: "FP Restoration upon [Weapon] Attacks", effect: "Restores ~2 FP per hit (same for every weapon type)", category: "regen", stack: "no", crossover: true },
  { name: "Stamina Recovery upon Landing Attacks", effect: "Restores 2 / 3 stamina with continuous attacks", category: "regen", stack: "tiers", crossover: true },
  // Exploration
  { name: "Items Confer Effect to All Nearby Allies", effect: "Items you use also confer their effect to nearby allies", category: "exploration", stack: "no", crossover: true },
  { name: "Increased Rune Acquisition for Self and Allies", effect: "+3.5% rune gain for you and nearby allies", category: "exploration", stack: "yes", crossover: true },
  { name: "Rune Discount for Shop Purchases While on Expedition", effect: "10% discount at merchants", category: "exploration", stack: "no", crossover: true },
  { name: "Treasure Marked upon Map", effect: "Reveals hidden chest locations", category: "exploration", stack: "no", crossover: true },
  { name: "Flask Also Heals Allies", effect: "Heals nearby allies for 50% of the flask's HP", category: "exploration", stack: "no", crossover: true },
  // Start of Game
  { name: "Stonesword Key in possession at start of expedition", effect: "Begin the expedition holding a Stonesword Key", category: "start", stack: "no", crossover: true },
  { name: "Small Pouch in possession at start of expedition", effect: "Begin the expedition holding a Small Pouch", category: "start", stack: "yes", crossover: true },
];
