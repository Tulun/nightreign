// ─────────────────────────────────────────────────────────────────────────
//  Which relic effects in a loadout actually do anything.
//
//  The game marks two kinds of dead effect, and this works out both:
//
//    · greyed out — the effect can't apply to this Nightfarer at all. Either
//      it belongs to someone else ("[Guardian] …" on an Ironeye build), or it
//      modifies a starting armament that can't take it (a sword skill on
//      Recluse's staff, an affinity on a catalyst).
//    · greyed out with a red [!] — the effect *could* apply, but an earlier
//      relic already claimed it. Relics resolve left to right, so the
//      left-most one that changes the starting armament's affinity (or its
//      skill) wins and the rest are ignored.
//
//  Slots resolve within one loadout: the three Deep of Night slots are the
//  same three sockets recoloured for a Deep expedition, not extra ones, so a
//  normal relic never clashes with a Deep one.
// ─────────────────────────────────────────────────────────────────────────

import { AFFINITY_ARMAMENTS, SKILL_SWAP_ARMAMENTS, STARTING_ARMAMENTS } from "@/data/startingArmaments";
import { CHARACTER_ORDER, gameEffectName } from "@/lib/relics";

/** What an effect line targets, where that decides whether it lands. */
type EffectKind =
  | { kind: "character"; character: string }
  | { kind: "affinity" }
  | { kind: "skill-swap"; skill: string }
  | { kind: "spell-swap"; casting: "sorcery" | "incantation" }
  | { kind: "discover" };

export type EffectState =
  | { active: true }
  /** Can't apply to this Nightfarer — greyed out, no warning glyph. */
  | { active: false; clash: false; reason: string }
  /** Would apply, but an earlier relic in the loadout got there first. */
  | { active: false; clash: true; reason: string };

const ACTIVE: EffectState = { active: true };

/** Straight quotes and lower case, so OCR'd and hand-typed text match alike. */
function normalize(text: string): string {
  return gameEffectName(text.trim()).replace(/[’']/g, "'").toLowerCase();
}

/**
 * What an effect line targets, or null when it lands on the Nightfarer no
 * matter who they are (an attack-power roll, a stat, a resistance).
 */
function classify(text: string): EffectKind | null {
  const key = normalize(text);

  const tagged = key.match(/^\[([a-z]+)\]/);
  if (tagged) {
    const character = CHARACTER_ORDER.find((c) => c.toLowerCase() === tagged[1]);
    if (character) return { kind: "character", character };
  }

  if (/^starting armament (deals|inflicts) /.test(key)) return { kind: "affinity" };

  const skill = key.match(/^changes? compatible armament's skill to (.+?) at start of expedition$/);
  if (skill) {
    const name = Object.keys(SKILL_SWAP_ARMAMENTS).find((s) => s.replace(/[’']/g, "'").toLowerCase() === skill[1]);
    // An unrecognised skill name is treated as landing — better a missed
    // warning than a build page that greys out an effect that works.
    return name ? { kind: "skill-swap", skill: name } : null;
  }

  const spell = key.match(/^changes? compatible armament's (sorcery|incantation) to .+ at start of expedition$/);
  if (spell) return { kind: "spell-swap", casting: spell[1] as "sorcery" | "incantation" };

  if (/^dormant power helps discover/.test(key)) return { kind: "discover" };

  return null;
}

/**
 * The clash group an effect competes in — one group, one winner, earliest
 * slot takes it. Affinity and the skill/spell swaps are separate races: a
 * relic can hand you a poison starting armament *and* a new skill on it. The
 * skill and spell swaps share a race, though, because a Nightfarer holding
 * both a weapon and a catalyst (Revenant) only ever gets one of them swapped
 * — unverified in-game, see the checklist atop data/startingArmaments.ts.
 */
function clashGroup(kind: EffectKind): string | null {
  switch (kind.kind) {
    case "affinity":
      return "affinity";
    case "skill-swap":
    case "spell-swap":
      return "armament-swap";
    case "discover":
      return "discover";
    default:
      return null;
  }
}

/** Whether this Nightfarer can use the effect at all, and why not if they can't. */
function compatibility(kind: EffectKind, character: string): { ok: true } | { ok: false; reason: string } {
  const armaments = STARTING_ARMAMENTS[character];
  // An unknown Nightfarer (a build saved before a character existed) gets the
  // benefit of the doubt everywhere except the character tag, which is exact.
  switch (kind.kind) {
    case "character":
      return kind.character === character
        ? { ok: true }
        : { ok: false, reason: `Only works for ${kind.character}` };
    case "affinity": {
      if (!armaments) return { ok: true };
      const fits = armaments.filter((a) => AFFINITY_ARMAMENTS.includes(a.type));
      return fits.length
        ? { ok: true }
        : { ok: false, reason: `${armaments[0].name} can't take an affinity` };
    }
    case "skill-swap": {
      if (!armaments) return { ok: true };
      const allowed = SKILL_SWAP_ARMAMENTS[kind.skill] ?? [];
      const fits = armaments.some((a) => allowed.includes(a.type));
      return fits
        ? { ok: true }
        : { ok: false, reason: `${kind.skill} doesn't fit ${armaments[0].name}` };
    }
    case "spell-swap": {
      if (!armaments) return { ok: true };
      const fits = armaments.some((a) => a.catalyst === kind.casting);
      const catalyst = kind.casting === "sorcery" ? "a staff" : "a sacred seal";
      return fits ? { ok: true } : { ok: false, reason: `${character} doesn't start with ${catalyst}` };
    }
    default:
      return { ok: true };
  }
}

/** Human-readable name for a clash group, for the warning's tooltip. */
const CLASH_LABEL: Record<string, string> = {
  affinity: "starting armament's affinity",
  "armament-swap": "starting armament's skill or spell",
  discover: "preferred weapon class",
};

/**
 * Mark every effect in one loadout as landing or not. `slots` holds the
 * effect text of each slot in the order the game resolves them (slot 1 → 3);
 * the result is parallel, one state per line.
 *
 * Normal and Deep of Night slots are separate loadouts — call this once for
 * each, never with the six together.
 */
export function loadoutEffectStates(character: string, slots: string[][]): EffectState[][] {
  /** Clash group → the slot that already won it (1-based, for the message). */
  const claimed = new Map<string, number>();
  return slots.map((lines, slotIndex) =>
    lines.map((text) => {
      const kind = classify(text);
      if (!kind) return ACTIVE;
      const compat = compatibility(kind, character);
      if (!compat.ok) return { active: false, clash: false, reason: compat.reason };
      const group = clashGroup(kind);
      if (!group) return ACTIVE;
      const winner = claimed.get(group);
      if (winner === undefined) {
        claimed.set(group, slotIndex + 1);
        return ACTIVE;
      }
      // Two swaps on one relic is possible (a skill swap and a spell swap are
      // different categories), and they race each other the same way.
      const already = winner === slotIndex + 1 ? "This relic" : `Relic ${winner}`;
      return {
        active: false,
        clash: true,
        reason: `${already} already changes the ${CLASH_LABEL[group]} — the left-most one wins`,
      };
    }),
  );
}

/**
 * One relic judged on its own — for lists where there's a Nightfarer but no
 * loadout to order against (the relic browser). Only incompatibility shows
 * up; a clash needs a relic to its left, which a lone relic doesn't have.
 */
export function soloEffectStates(character: string, lines: string[]): EffectState[] {
  return loadoutEffectStates(character, [lines])[0];
}
