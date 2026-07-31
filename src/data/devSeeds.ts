// ─────────────────────────────────────────────────────────────────────────
//  DEV SEED FIXTURES  ·  localhost-only sample build stores
// ─────────────────────────────────────────────────────────────────────────
//  Loaded by ?seed=<name> (see lib/devSeed.ts) so a populated My Builds /
//  My Relics / party planner is one navigation away instead of a long
//  session of hand-entering relics or running OCR over screenshots.
//
//  The point of the fixture is coverage, not a plausible player's account:
//  every relic color, all three effect-line counts (which drive the relic
//  look), an explicit look override, Deep relics with demerits, a build with
//  variants, filled Deep slots, a fixed (unique) relic in a White socket,
//  tags, and a slot pointing at a deleted relic. Effect and chalice strings
//  are the real ones from data/relicEffects + data/chalices, so anything
//  keyed off them (icons, effect matching, slot legality) behaves as it
//  would with real data.
//
//  Ids are all `seed-` prefixed: it makes seeded entries obvious in devtools
//  and trivial to tell apart from anything you created yourself.
// ─────────────────────────────────────────────────────────────────────────

import { EMPTY_SLOTS, type BuildStore, type SlotTriple } from "@/lib/builds";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const custom = (id: string): SlotTriple[number] => ({ kind: "custom", id });
const fixed = (name: string): SlotTriple[number] => ({ kind: "fixed", name });

/**
 * The main fixture. Times are relative to `now` so the store never ages into
 * a state the app treats differently — tombstones expire after 90 days, and
 * a build only survives its own tombstone by being newer than it.
 */
function demo(now: number): BuildStore {
  return {
    version: 3,
    customRelics: [
      // 3 effects → renders "grand".
      {
        id: "seed-relic-red-1",
        name: "Bloodied Scene",
        color: "Red",
        effects: ["Physical Attack Up +2", "Vigor +2", "Improved Poison Resistance"],
        demerits: ["", "", ""],
        deep: false,
        tags: ["keeper", "poison"],
      },
      // 2 effects → "polished".
      {
        id: "seed-relic-blue-1",
        name: "",
        color: "Blue",
        effects: ["Magic Attack Power Up +1", "Mind +2"],
        demerits: ["", ""],
        deep: false,
      },
      // 1 effect → "delicate"; also the unnamed-relic fallback ("Green relic").
      {
        id: "seed-relic-green-1",
        name: "",
        color: "Green",
        effects: ["Stamina Recovery upon Landing Attacks"],
        demerits: [""],
        deep: false,
      },
      // Explicit look that disagrees with the effect count — the override
      // must win over the count-derived default.
      {
        id: "seed-relic-yellow-1",
        name: "Tiny Luminous Oddity",
        color: "Yellow",
        look: "delicate",
        effects: [
          "Holy Attack Power Up +2",
          "Character Skill Cooldown Reduction +2",
          "Improved Frost Resistance",
        ],
        demerits: ["", "", ""],
        deep: false,
      },
      // Character-locked effect line (Duchess).
      {
        id: "seed-relic-yellow-2",
        name: "Duchess' Trinket",
        color: "Yellow",
        effects: ["Duchess: Improved Character Skill Attack Power", "Dexterity +2"],
        demerits: ["", ""],
        deep: false,
      },
      {
        id: "seed-relic-green-2",
        name: "Emberleaf",
        color: "Green",
        effects: ["Starting armament deals fire damage", "Improved Blood Loss Resistance"],
        demerits: ["", ""],
        deep: false,
      },
      // Deep relics: one demerit on the first line only…
      {
        id: "seed-relic-deep-red",
        name: "Deep Ember",
        color: "Red",
        effects: ["Physical Attack Up +2", "Poise +3"],
        demerits: ["Reduced Rune Acquisition", ""],
        deep: true,
        // Also carries a keyword whose registry entry was deleted (see the
        // relicTag tombstone below) — the strip-on-load path.
        tags: ["keeper", "junk"],
      },
      // …and demerits on lines 1 and 3, with line 2 clean.
      {
        id: "seed-relic-deep-blue",
        name: "Deep Tide",
        color: "Blue",
        effects: [
          "Magic Attack Power Up +2",
          "Intelligence +3",
          "Improved Damage Negation at Low HP",
        ],
        demerits: ["Continuous HP Loss", "", "All Resistances Down"],
        deep: true,
      },
    ],
    builds: [
      // Fixed relic in a White socket + a second loadout variant whose Deep
      // slots are filled.
      {
        id: "seed-build-wylder",
        name: "Wylder — Guard Counter",
        character: "Wylder",
        chalice: "Wylder's Chalice", // Red / Yellow / White
        slots: [custom("seed-relic-red-1"), custom("seed-relic-yellow-1"), fixed("Night of the Baron")],
        deepSlots: [...EMPTY_SLOTS] as SlotTriple,
        notes: "Poke, guard counter, repeat. Swap to the Deep run variant for Depth 3+.",
        tags: ["favourite", "solo"],
        variantName: "Main",
        variants: [
          {
            name: "Deep run",
            chalice: "Wylder's Urn", // Red / Red / Blue, same in Deep
            slots: [custom("seed-relic-red-1"), null, custom("seed-relic-blue-1")],
            deepSlots: [custom("seed-relic-deep-red"), null, custom("seed-relic-deep-blue")],
          },
        ],
        updatedAt: now - 2 * HOUR,
      },
      // Deep slots filled on the build's own loadout.
      {
        id: "seed-build-duchess",
        name: "Duchess — Restage",
        character: "Duchess",
        chalice: "Duchess' Chalice", // Blue / Yellow / White, Deep Red / Blue / Yellow
        slots: [custom("seed-relic-blue-1"), custom("seed-relic-yellow-2"), custom("seed-relic-green-1")],
        deepSlots: [custom("seed-relic-deep-red"), custom("seed-relic-deep-blue"), null],
        notes: "",
        tags: ["dlc"],
        updatedAt: now - 30 * HOUR,
      },
      // Plain build, partly empty, long note.
      {
        id: "seed-build-recluse",
        name: "Recluse — Magic Cocktail",
        character: "Recluse",
        chalice: "Recluse's Urn", // Blue / Blue / Green
        slots: [custom("seed-relic-blue-1"), null, custom("seed-relic-green-2")],
        deepSlots: [...EMPTY_SLOTS] as SlotTriple,
        notes:
          "Third slot is a placeholder until a Green with an Int line turns up. " +
          "Mixing Fire + Magic residue covers the early bosses; Frost for the Fissure.",
        tags: [],
        updatedAt: now - 6 * DAY,
      },
      // First slot points at a relic that was deleted (tombstoned below) —
      // the dangling-reference path.
      {
        id: "seed-build-executor",
        name: "Executor — missing relic",
        character: "Executor",
        chalice: "Executor's Urn", // Red / Yellow / Yellow
        slots: [custom("seed-relic-gone"), null, custom("seed-relic-yellow-1")],
        deepSlots: [...EMPTY_SLOTS] as SlotTriple,
        notes: "Slot 1 references a relic that no longer exists.",
        updatedAt: now - 9 * DAY,
      },
    ],
    tags: ["dlc", "favourite", "solo"],
    relicTags: ["keeper", "poison", "trade bait"],
    deleted: {
      "seed-relic-gone": now - 3 * DAY,
      "tag:retired": now - 5 * DAY,
      "relicTag:junk": now - 5 * DAY,
    },
  };
}

/** Everything wiped — the first-run state, without clearing storage by hand. */
function empty(): BuildStore {
  return { version: 3, builds: [], customRelics: [], tags: [], relicTags: [], deleted: {} };
}

export const devSeeds: Record<string, (now: number) => BuildStore> = {
  demo,
  empty,
};

export const devSeedNames = Object.keys(devSeeds);
