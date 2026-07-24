// ─────────────────────────────────────────────────────────────────────────
//  Effect vocabulary + fuzzy matching for the screenshot importer. OCR output
//  is noisy, but relic effects are a closed vocabulary — snapping each OCR
//  line to its nearest known effect turns sloppy text into clean data.
// ─────────────────────────────────────────────────────────────────────────

import { deepRelics } from "@/data/deepRelics";
import { relicEffects } from "@/data/relicEffects";
import { uniqueRelics } from "@/data/uniqueRelics";

/** Every effect name a relic can carry, deduplicated. */
export const EFFECT_VOCABULARY: string[] = Array.from(
  new Set([
    ...relicEffects.map((e) => e.name),
    ...deepRelics.map((e) => e.name),
    ...uniqueRelics.flatMap((r) => r.effects),
  ]),
).sort();

/** Lowercase and strip everything but letters, digits, and plus signs. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
}

/** Levenshtein distance with a simple two-row implementation. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Similarity in [0, 1] — 1 is identical after normalization. */
export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // A vocab entry fully contained in a longer OCR line is a near-certain hit.
  if (na.length >= 12 && nb.includes(na)) return 0.95;
  if (nb.length >= 12 && na.includes(nb)) return 0.95;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

export interface EffectMatch {
  /** The canonical effect name from the vocabulary. */
  effect: string;
  /** Best similarity score across the OCR lines that produced it. */
  score: number;
  /** The OCR line that matched. */
  line: string;
}

/**
 * Match OCR lines against the effect vocabulary. Returns candidates sorted by
 * score (best first), deduplicated by effect. Lines shorter than 8 characters
 * are ignored — they're UI fragments, not effects.
 */
export function matchOcrLines(lines: string[], minScore = 0.5): EffectMatch[] {
  const best = new Map<string, EffectMatch>();
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 8) continue;
    const top = bestMatch(line, EFFECT_VOCABULARY, minScore);
    if (top && (!best.has(top.effect) || best.get(top.effect)!.score < top.score)) {
      best.set(top.effect, top);
    }
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}

function bestMatch(line: string, vocab: string[], minScore: number): EffectMatch | null {
  let top: EffectMatch | null = null;
  for (const effect of vocab) {
    const score = similarity(line, effect);
    if (score >= minScore && (!top || score > top.score)) {
      top = { effect, score, line };
    }
  }
  return top;
}

// ── Whole-screenshot parsing ─────────────────────────────────────────────
// A game screenshot of the relic rites screen lists each relic's name with
// its effects underneath. Relic names act as section headers: matching them
// lets us group the effect lines that follow into per-relic clusters.

const SCENE_NAMES: string[] = ["Delicate", "Polished", "Grand"].flatMap((size) =>
  ["Burning", "Tranquil", "Drizzly", "Luminous"].flatMap((scene) => [
    `${size} ${scene} Scene`,
    `Deep ${size} ${scene} Scene`,
  ]),
);

/** Every relic display name that can head a group in a screenshot. */
export const RELIC_NAME_VOCABULARY: string[] = Array.from(
  new Set([...uniqueRelics.map((r) => r.name), ...SCENE_NAMES]),
).sort();

export interface ParsedRelicGroup {
  /** Matched relic name, or null when only effects were recognized. */
  name: string | null;
  effects: EffectMatch[];
}

/**
 * Cluster OCR lines into relic groups. A line matching a relic name starts a
 * new group; effect lines attach to the current group (max 3 per relic, as
 * in game). Returns at most `maxGroups` groups that contain something.
 */
export function parseRelicGroups(lines: string[], maxGroups = 6): ParsedRelicGroup[] {
  const groups: ParsedRelicGroup[] = [];
  let current: ParsedRelicGroup | null = null;
  const push = (g: ParsedRelicGroup) => {
    if (groups.length < maxGroups) groups.push(g);
    return g;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 8) continue;
    const asName = bestMatch(line, RELIC_NAME_VOCABULARY, 0.62);
    const asEffect = bestMatch(line, EFFECT_VOCABULARY, 0.5);
    if (asName && (!asEffect || asName.score >= asEffect.score)) {
      current = push({ name: asName.effect, effects: [] });
    } else if (asEffect) {
      if (!current || current.effects.length >= 3) {
        current = push({ name: null, effects: [] });
      }
      // Skip duplicates within a group (OCR sometimes doubles lines).
      if (!current.effects.some((e) => e.effect === asEffect.effect)) {
        current.effects.push(asEffect);
      }
    }
  }
  return groups.filter((g) => g.name !== null || g.effects.length > 0);
}
