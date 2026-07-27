// ─────────────────────────────────────────────────────────────────────────
//  Starting armaments — what each Nightfarer walks into Limveld holding.
//
//  This is what decides whether the armament-modifying relic effects do
//  anything: the affinity swaps ("Starting armament deals fire damage"), the
//  skill swaps, and the sorcery/incantation swaps all land on a *starting*
//  armament or on nothing at all. The game greys those out when they can't
//  apply — see lib/effectCompat.ts, which is what actually reads this table.
//
//  Sources: the Nightfarer pages on the Fextralife Nightreign wiki for the
//  loadouts; weapon types match src/data/weapons.ts.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
//  TO VERIFY IN-GAME
// ─────────────────────────────────────────────────────────────────────────
//  Everything below is confirmed except these five. Each says what the app
//  does today and the one screen that settles it — the relic loadout screen,
//  where the game greys an effect it won't apply. Delete an entry once it's
//  been checked, and fix the table below if the game disagrees.
//
//  1. Chilling Mist on Executor vs Revenant.
//     The skill's own text excludes "whips, fists, and claws", which greys it
//     on Revenant's Cursed Claws and leaves it live on Executor's Blade — how
//     the app has it. Fextralife's relic page says the exact opposite (lists
//     Revenant's Cursed Claws, omits Executor's Blade), and since it agrees
//     with the skill text on every other swap it reads as a slip there.
//     → Equip a Chilling Mist swap on Executor, then on Revenant.
//
//  2. Eruption on Undertaker's Hammer.
//     Text is "large and colossal swords, axes, and hammers". Read with the
//     size qualifier carrying across all three nouns, so a medium hammer is
//     out and the app greys it for Undertaker. If the qualifier only governs
//     swords, add "Hammer" to Eruption below.
//     → Equip an Eruption swap on Undertaker.
//
//  3. Scholar and Undertaker across the whole skill table.
//     The wiki's per-effect "Compatible with …" lists predate both DLC
//     Nightfarers, so their two columns come from the skill text alone with
//     nothing to check them against. #2 is the only entry that looked
//     genuinely ambiguous, but the pair is unverified as a whole.
//     → Worth a pass over the swaps on both once the rest is settled.
//
//  4. Whether a skill swap and a spell swap really race each other.
//     lib/effectCompat puts them in one clash group, following the note on
//     RELIC_CATEGORIES in lib/relics.ts: a Nightfarer holding both a weapon
//     and a catalyst only gets one of them swapped. Only Revenant can show
//     this. If they turn out to be independent, split "armament-swap" into
//     separate groups for skill and spell in clashGroup().
//     → On Revenant, slot a skill swap and an incantation swap and see
//       whether the second one takes the red [!].
//
//  5. Affinity on Recluse's Staff.
//     Greyed on the reasoning that a catalyst can't be infused, which
//     community write-ups agree with but no first-party source states.
//     → Equip "Starting armament deals fire damage" on Recluse.
// ─────────────────────────────────────────────────────────────────────────

/**
 * The armament classes a Nightfarer can *start* with. A subset of the weapon
 * types in data/weapons.ts — nothing else ever needs a compatibility ruling,
 * because relics only ever modify the starting kit.
 */
export type StartingArmamentType =
  | "Greatsword"
  | "Halberd"
  | "Bow"
  | "Dagger"
  | "Colossal Weapon"
  | "Fist"
  | "Katana"
  | "Thrusting Sword"
  | "Hammer"
  | "Glintstone Staff"
  | "Sacred Seal";

export interface StartingArmament {
  /** Weapon name as it appears in data/weapons.ts. */
  name: string;
  type: StartingArmamentType;
  /**
   * A catalyst casts rather than swings: it takes the spell swaps and takes
   * neither an affinity nor a weapon skill.
   */
  catalyst?: "sorcery" | "incantation";
}

/**
 * Each Nightfarer's starting armaments, in the order the game lists them.
 * Shields are left out — no relic effect targets one (none of the skill swaps
 * is a shield skill), so they'd only be noise here.
 */
export const STARTING_ARMAMENTS: Record<string, StartingArmament[]> = {
  Wylder: [{ name: "Wylder's Greatsword", type: "Greatsword" }],
  Guardian: [{ name: "Guardian's Halberd", type: "Halberd" }],
  Ironeye: [{ name: "Ironeye's Bow", type: "Bow" }],
  Duchess: [{ name: "Duchess' Dagger", type: "Dagger" }],
  Raider: [{ name: "Raider's Greataxe", type: "Colossal Weapon" }],
  // The only Nightfarer holding both a weapon and a catalyst.
  Revenant: [
    { name: "Revenant's Cursed Claws", type: "Fist" },
    { name: "Finger Seal", type: "Sacred Seal", catalyst: "incantation" },
  ],
  Recluse: [{ name: "Recluse's Staff", type: "Glintstone Staff", catalyst: "sorcery" }],
  Executor: [{ name: "Executor's Blade", type: "Katana" }],
  Scholar: [{ name: "Scholar's Thrusting Sword", type: "Thrusting Sword" }],
  Undertaker: [{ name: "Undertaker's Hammer", type: "Hammer" }],
};

// ── Skill swaps ─────────────────────────────────────────────────────────────

/** Every starting armament that can carry a weapon skill at all. */
const ALL_MELEE: StartingArmamentType[] = [
  "Greatsword", "Halberd", "Dagger", "Colossal Weapon", "Fist", "Katana", "Thrusting Sword", "Hammer",
];

/** Melee minus the classes the game calls "whips, fists, and claws". */
const MELEE_NO_FISTS: StartingArmamentType[] = ALL_MELEE.filter((t) => t !== "Fist");

/**
 * "Swords" in an Ash of War's own wording covers every blade class by size:
 * small = daggers, medium = katanas and thrusting swords, large = greatswords.
 */
const SWORDS_SMALL_TO_LARGE: StartingArmamentType[] = ["Dagger", "Katana", "Thrusting Sword", "Greatsword"];

/**
 * Which starting armaments each swappable skill will actually land on, keyed
 * by the skill name inside "Changes compatible armament's skill to … at start
 * of expedition".
 *
 * Derived from each skill's own "Usable Armament Types" line in
 * data/weaponSkills.ts (quoted above each entry) applied to the eleven
 * starting-armament classes above — the game's wording is the authority, and
 * it agrees with the per-effect "Compatible with …" lists the Fextralife wiki
 * publishes for the eight launch Nightfarers on every effect checked except
 * Chilling Mist, where the wiki's list omits Executor's Blade (a katana) and
 * includes Revenant's Cursed Claws (a fist) — the exact opposite of what the
 * skill's own text says, so it reads as a wiki slip and the text wins here.
 *
 * The wiki's lists predate Scholar and Undertaker, so those two columns come
 * from the skill text alone.
 */
export const SKILL_SWAP_ARMAMENTS: Record<string, StartingArmamentType[]> = {
  // "Usable with swords as well as polearms capable of thrusting (excluding colossal weapons)"
  "Glintblade Phalanx": [...SWORDS_SMALL_TO_LARGE, "Halberd"],
  // "Usable with melee armaments (excluding small armaments and whips)"
  Gravitas: ALL_MELEE.filter((t) => t !== "Dagger" && t !== "Fist"),
  // "Usable with melee armaments (excluding colossal weapons and whips)"
  "Flaming Strike": ALL_MELEE.filter((t) => t !== "Colossal Weapon"),
  // "Usable with large and colossal swords, axes, and hammers" — the size
  // qualifier carries across all three, so Undertaker's medium hammer is out.
  Eruption: ["Greatsword", "Colossal Weapon"],
  // "Usable with all melee armaments"
  Thunderbolt: ALL_MELEE,
  // "Usable with swords, axes, and hammers"
  "Lightning Slash": [...SWORDS_SMALL_TO_LARGE, "Colossal Weapon", "Hammer"],
  // "Usable with melee armaments (excluding whips, fists, and claws)"
  "Sacred Blade": MELEE_NO_FISTS,
  // "Usable with axes and hammers"
  "Prayerful Strike": ["Colossal Weapon", "Hammer"],
  // "Usable with melee armaments (excluding whips, fists, and claws)"
  "Poisonous Mist": MELEE_NO_FISTS,
  // "Usable with small and medium swords (excluding twinblades)"
  "Poison Moth Flight": ["Dagger", "Katana", "Thrusting Sword"],
  // "Usable with small and medium swords"
  "Blood Blade": ["Dagger", "Katana", "Thrusting Sword"],
  // "Usable with swords as well as polearms capable of thrusting (excluding small and colossal weapons)"
  Seppuku: ["Katana", "Thrusting Sword", "Greatsword", "Halberd"],
  // "Usable with melee armaments (excluding whips, fists, and claws)"
  "Chilling Mist": MELEE_NO_FISTS,
  // "Usable with all melee armaments"
  "Hoarfrost Stomp": ALL_MELEE,
  "White Shadow's Lure": ALL_MELEE,
  Endure: ALL_MELEE,
  Quickstep: ALL_MELEE,
  "Storm Stomp": ALL_MELEE,
  Determination: ALL_MELEE,
  // "Usable with all bows"
  "Rain of Arrows": ["Bow"],
};

/**
 * Armaments an affinity swap ("… deals fire damage", "… inflicts poison")
 * can infuse. A catalyst can't be infused, which is what makes the whole
 * affinity pool dead weight on Recluse.
 */
export const AFFINITY_ARMAMENTS: StartingArmamentType[] = [...ALL_MELEE, "Bow"];
