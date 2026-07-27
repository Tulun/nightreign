// ─────────────────────────────────────────────────────────────────────────
//  Effect vocabulary + fuzzy matching for the screenshot importer. OCR output
//  is noisy, but relic effects are a closed vocabulary — snapping each OCR
//  line to its nearest known effect turns sloppy text into clean data.
// ─────────────────────────────────────────────────────────────────────────

import { deepRelics } from "@/data/deepRelics";
import { relicEffects } from "@/data/relicEffects";
import { uniqueRelics } from "@/data/uniqueRelics";

// Template effect names ("Improved [Weapon] Attack Power") are expanded into
// concrete variants so OCR of real UI text ("Improved Greatsword Attack
// Power") matches well — and so two different weapon classes don't collapse
// into the same canonical name and get deduplicated away.
const WEAPON_CLASSES = [
  "Dagger", "Straight Sword", "Greatsword", "Colossal Sword", "Curved Sword",
  "Curved Greatsword", "Katana", "Twinblade", "Thrusting Sword",
  "Heavy Thrusting Sword", "Axe", "Greataxe", "Hammer", "Flail", "Great Hammer",
  "Colossal Weapon", "Spear", "Great Spear", "Halberd", "Reaper", "Whip",
  "Fist", "Claw", "Bow", "Greatbow", "Crossbow", "Staves", "Sacred Seal",
  "Torch", "Small Shield", "Medium Shield", "Greatshield",
];
const ELEMENTS = ["Magic", "Fire", "Lightning", "Holy"];
const STATUSES = ["Poison", "Scarlet Rot", "Blood Loss", "Frostbite", "Sleep", "Madness", "Death Blight"];

/** The "[Item] in possession…" pool: crystal/cracked tears and perfume items. */
const POSSESSION_ITEMS = [
  "Cerulean Crystal Tear", "Cerulean Hidden Tear", "Crimson Bubbletear",
  "Crimson Crystal Tear", "Crimsonburst Crystal Tear", "Crimsonspill Crystal Tear",
  "Crimsonwhorl Bubbletear", "Flame-Shrouding Cracked Tear", "Greenburst Crystal Tear",
  "Greenspill Crystal Tear", "Holy-Shrouding Cracked Tear", "Leaden Hardtear",
  "Lightning-Shrouding Cracked Tear", "Magic-Shrouding Cracked Tear",
  "Opaline Bubbletear", "Opaline Hardtear", "Speckled Hardtear", "Spiked Crystal Tear",
  "Stonebarb Cracked Tear", "Thorny Cracked Tear", "Twiggy Cracked Tear",
  "Windy Crystal Tear", "Acid Spraymist", "Bloodboil Aromatic", "Ironjar Aromatic",
  "Uplifting Aromatic",
];

/**
 * Grouped names that expand to the concrete per-variant names the game
 * shows (any tier suffix is preserved). Element groups expand to the normal
 * catalogue's "<Element> Attack Power Up" phrasing so tiers of the same
 * effect line up ("Magic/Fire/Lightning/Holy Attack Up +2" → the existing
 * "Fire Attack Power Up +2" entry, not a second spelling of it).
 */
const AFFLICTED = ["Poison", "Rot", "Frost"].map((s) => `Attack Power Up vs ${s}-Afflicted Enemy`);
const NAME_GROUPS: [string, string[]][] = [
  ["Magic/Fire/Lightning/Holy Attack Up", ELEMENTS.map((e) => `${e} Attack Power Up`)],
  ["Attack Power Up vs Poison/Rot/Frost-Afflicted Enemy", AFFLICTED],
  ["Attack Power Up vs Frost/Poison/Rot-Afflicted Enemy", AFFLICTED],
  ["Sleep/Madness in Vicinity Improves Attack Power",
    ["Sleep", "Madness"].map((s) => `${s} in Vicinity Improves Attack Power`)],
  // The game shows these as separate per-spell-type lines ("Improved
  // Sorceries +1" — seen on a Deep relic in-game).
  ["Improved Sorceries/Incantations", ["Improved Sorceries", "Improved Incantations"]],
  ["Improved [Consumable] Damage",
    ["Improved Throwing Pot Damage", "Improved Throwing Knife Damage",
     "Improved Throwing Stone Damage", "Improved Perfuming Arts Damage"]],
];

/** "Foo +3/4" → ["Foo +3", "Foo +4"]; names without a tier group pass through. */
function splitTierSuffix(name: string): string[] {
  const m = name.match(/^(.+?) \+(\d(?:\/\+?\d)+)$/);
  if (!m) return [name];
  return m[2].split("/").map((t) => `${m[1]} +${t.replace(/^\+/, "")}`);
}

function expandName(name: string): string[] {
  return splitTierSuffix(name).flatMap((tiered) => {
    const group = NAME_GROUPS.find(([key]) => tiered.startsWith(key));
    const variants = group ? group[1].map((v) => tiered.replace(group[0], v)) : [tiered];
    return variants.flatMap((v) => {
      const token = ["[Weapon Class]", "[Weapon]", "[Element]", "[Status]", "[Item]"].find((t) => v.includes(t));
      if (!token) return [v];
      const list =
        token === "[Element]" ? ELEMENTS
        : token === "[Status]" ? STATUSES
        : token === "[Item]" ? POSSESSION_ITEMS
        : WEAPON_CLASSES;
      return list.map((x) => v.split(token).join(x));
    });
  });
}

/** Case/punctuation-insensitive key for spotting duplicate spellings. */
function nameKey(s: string): string {
  return normalize(s.replace(/ & /g, " and "));
}

/**
 * The same effect is spelled differently across sources (wiki title case vs
 * in-game sentence case, wiki "Duchess:" vs the game's "[Duchess]").
 * Collapse to one spelling per effect, preferring the in-game style.
 */
function preferName(a: string, b: string): string {
  if (a.startsWith("[") !== b.startsWith("[")) return a.startsWith("[") ? a : b;
  const lowers = (s: string) => (s.match(/[a-z]/g) ?? []).length;
  return lowers(b) > lowers(a) ? b : a;
}

const CANONICAL_BY_KEY = new Map<string, string>();
for (const name of [
  ...relicEffects.map((e) => e.name),
  ...deepRelics.map((e) => e.name),
  ...uniqueRelics.flatMap((r) => r.effects),
].flatMap(expandName)) {
  const key = nameKey(name);
  const existing = CANONICAL_BY_KEY.get(key);
  CANONICAL_BY_KEY.set(key, existing ? preferName(existing, name) : name);
}

/** Canonical spelling for any known effect-name variant; unknown text passes through. */
export function canonicalEffectName(name: string): string {
  return CANONICAL_BY_KEY.get(nameKey(name)) ?? name;
}

/** Every effect name a relic can carry — templates expanded, deduplicated. */
export const EFFECT_VOCABULARY: string[] = Array.from(new Set(CANONICAL_BY_KEY.values())).sort();

/**
 * In-game phrasings that differ from the catalogue's names. Matching against
 * these resolves to the canonical name, so OCR of the real UI text doesn't
 * get pulled toward a lexically-closer but wrong effect.
 */
const EFFECT_ALIASES: Record<string, string> = {
  "Attack power increased for each Night Invader defeated":
    "Attack power up after defeating a Night Invader",
  "Max FP increased for each Sorcerer's Rise unlocked":
    "Max FP permanently increased after releasing Sorcerer's Rise mechanism",
  "Reduced Damage Negation After Evading": "Repeated Evasions Lower Damage Negation",
  "Extended Spell Duration": "Extend Spell Duration",
  "Taking Damage Causes Frost Buildup": "Taking Damage Causes Frostbite Buildup",
  "Max stamina increased for each great enemy defeated at a Great Encampment":
    "Max Stamina increased per Great Encampment boss",
  "[Raider] Hit With Character Skill to Reduce Enemy Attack Power":
    "[Raider] Hit With Skill to Reduce Enemy Attack Power",
  "[Undertaker] Attack power increased by landing the final blow of a chain attack":
    "Undertaker: Attack Power Increased by Landing Chain Attack",
};

/** "Great Hammer" → "Great Hammers", "Torch" → "Torches"; "Staves" stays. */
function pluralizeWeapon(w: string): string {
  if (w.endsWith("s")) return w;
  return /(ch|sh|x)$/.test(w) ? `${w}es` : `${w}s`;
}

// The game spells out "and" where the catalogue writes "&" (in either stat
// order — it shows "Reduced Intelligence and Dexterity" for the catalogue's
// "Reduced Dexterity & Intelligence"), and tags character effects
// "[Duchess] …" where the catalogue writes "Duchess: …" — accept the
// in-game phrasing for every such entry (verified in-game).
for (const name of EFFECT_VOCABULARY) {
  if (name.includes(" & ")) EFFECT_ALIASES[name.replace(/ & /g, " and ")] = name;
  const pair = name.match(/^Reduced ([A-Za-z]+) & ([A-Za-z]+)$/);
  if (pair) EFFECT_ALIASES[`Reduced ${pair[2]} and ${pair[1]}`] = name;
  const prefixed = name.match(/^([A-Z][a-z]+): (.+)$/);
  if (prefixed) EFFECT_ALIASES[`[${prefixed[1]}] ${prefixed[2]}`] = name;
  // Deep tiers of the afflicted-enemy effects: catalogue "Attack Power Up vs
  // Poison-Afflicted Enemy +1", game "Attack power up when facing
  // poison-afflicted enemy +1".
  const afflicted = name.match(/^Attack Power Up vs ([A-Za-z]+)-Afflicted Enemy( \+\d)?$/);
  if (afflicted) {
    EFFECT_ALIASES[`Attack power up when facing ${afflicted[1].toLowerCase()}-afflicted enemy${afflicted[2] ?? ""}`] = name;
  }
  // The game pluralizes the weapon class where the catalogue is singular —
  // "Improved Attack Power with 3+ Colossal Weapons Equipped", "Dormant
  // Power Helps Discover Great Hammers" / "… Fists" (all verified in-game).
  const equipped = name.match(/^Improved Attack Power with 3\+ (.+) Equipped$/);
  if (equipped && pluralizeWeapon(equipped[1]) !== equipped[1]) {
    EFFECT_ALIASES[`Improved Attack Power with 3+ ${pluralizeWeapon(equipped[1])} Equipped`] = name;
  }
  const dormant = name.match(/^Dormant Power Helps Discover (.+?)( \+\d)?$/);
  if (dormant && pluralizeWeapon(dormant[1]) !== dormant[1]) {
    EFFECT_ALIASES[`Dormant Power Helps Discover ${pluralizeWeapon(dormant[1])}${dormant[2] ?? ""}`] = name;
  }
  // Deep relics display the base tier with no suffix where the catalogue
  // writes "+0" ("Improved Affinity Attack Power" — verified in-game).
  const base = name.match(/^(.+) \+0$/);
  if (base && !CANONICAL_BY_KEY.has(nameKey(base[1]))) EFFECT_ALIASES[base[1]] = name;
}

const LOWER_ALIASES = new Map(
  Object.entries(EFFECT_ALIASES).map(([text, canonical]) => [text.toLowerCase(), canonical]),
);

/** Canonical name for an in-game alias phrasing (case-insensitive); other text passes through. */
export function resolveEffectAlias(name: string): string {
  const target = EFFECT_ALIASES[name] ?? LOWER_ALIASES.get(name.toLowerCase());
  return canonicalEffectName(target ?? name);
}

/** Match targets: canonical names plus alias phrasings that map back to them. */
const MATCH_ENTRIES: { text: string; canonical: string }[] = [
  ...EFFECT_VOCABULARY.map((v) => ({ text: v, canonical: v })),
  ...Object.entries(EFFECT_ALIASES).map(([text, canonical]) => ({ text, canonical: canonicalEffectName(canonical) })),
];

const expandCanonical = (name: string) => expandName(name).map(canonicalEffectName);

const NORMAL_EFFECT_NAMES = new Set<string>(
  [...relicEffects.map((e) => e.name), ...uniqueRelics.flatMap((r) => r.effects)].flatMap(expandCanonical),
);

/** Effects that only exist on Deep relics — seeing one marks a relic as Deep. */
export const DEEP_ONLY_EFFECTS = new Set<string>(
  deepRelics
    .filter((d) => !d.crossover)
    .flatMap((d) => expandCanonical(d.name))
    .filter((name) => !NORMAL_EFFECT_NAMES.has(name)),
);

/** Deep relic curses — they trail a Deep relic's effects as a fourth line. */
const CURSE_EFFECTS = new Set<string>(
  deepRelics.filter((d) => d.category === "curse").flatMap((d) => expandCanonical(d.name)),
);

// Per-kind vocabularies for relic creation: a rolled relic can only carry
// effects from its own pool, so suggestions are filtered by relic kind.

/** Effects legal on rolled normal relics — the normal pool minus fixed-only. */
export const NORMAL_EFFECT_VOCABULARY: string[] = Array.from(
  new Set(relicEffects.filter((e) => e.category !== "unrollable").flatMap((e) => expandCanonical(e.name))),
).sort();

/** Effects legal on Deep relics (stat swaps included), without the curses. */
export const DEEP_EFFECT_VOCABULARY: string[] = Array.from(
  new Set(deepRelics.filter((d) => d.category !== "curse").flatMap((d) => expandCanonical(d.name))),
).sort();

/** Deep relic curses — the only legal demerit lines. */
export const CURSE_VOCABULARY: string[] = Array.from(CURSE_EFFECTS).sort();

/** Whether an effect is a Deep relic curse (demerit). */
export function isCurseEffect(name: string): boolean {
  return CURSE_EFFECTS.has(name);
}

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
  // One string fully contained in the other is a strong hit, scaled by how
  // much of the longer one it covers — so a short entry ("HP Restoration")
  // buried in a long line can't outscore the line's real, longer effect.
  if (na.length >= 12 && nb.includes(na)) return 0.9 + 0.1 * (na.length / nb.length);
  if (nb.length >= 12 && na.includes(nb)) return 0.9 + 0.1 * (nb.length / na.length);
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
    const top = bestEffectMatch(line, minScore);
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

/**
 * Snap a matched effect to the "+N" tier the OCR line actually shows. Fuzzy
 * matching happily lands on a sibling tier (or the tierless base) when the
 * suffix is a single noisy character — but the digit after "+" in the line
 * is the ground truth whenever the corresponding vocabulary entry exists.
 */
function rescueTierSuffix(line: string, top: EffectMatch): EffectMatch {
  // Only rescue toward a digit the line actually shows — a missing "+N" is
  // usually OCR failing to read the suffix, not proof the effect is tierless.
  const digits = Array.from(line.matchAll(/\+\s?(\d)\b/g));
  if (digits.length === 0) return top;
  const want = `${top.effect.replace(/ \+\d$/, "")} +${digits[digits.length - 1][1]}`;
  if (want !== top.effect && CANONICAL_BY_KEY.has(nameKey(want))) {
    return { ...top, effect: canonicalEffectName(want) };
  }
  return top;
}

/** Like bestMatch, but over canonical names + aliases, resolving aliases. */
function bestEffectMatch(line: string, minScore: number): EffectMatch | null {
  let top: EffectMatch | null = null;
  for (const entry of MATCH_ENTRIES) {
    const score = similarity(line, entry.text);
    if (score >= minScore && (!top || score > top.score)) {
      top = { effect: entry.canonical, score, line };
    }
  }
  return top ? rescueTierSuffix(line, top) : null;
}

/**
 * How much a piece of OCR text looks like real screen text — its best match
 * against the effect vocabulary or the relic names. Used to pick the right
 * segment of a noise-polluted line (see ocrClean.ts).
 */
export function screenTextScore(s: string): number {
  if (s.trim().length < 8) return 0;
  return Math.max(
    bestEffectMatch(s, 0.3)?.score ?? 0,
    bestMatch(s, RELIC_NAME_VOCABULARY, 0.3)?.score ?? 0,
  );
}

/** Best match for ANY line against a vocabulary — e.g. spotting a chalice name. */
export function bestLineMatch(lines: string[], vocab: string[], minScore = 0.65): EffectMatch | null {
  let top: EffectMatch | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 8) continue;
    const m = bestMatch(line, vocab, minScore);
    if (m && (!top || m.score > top.score)) top = m;
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
  /** Per-line demerits: demerits[i] belongs to effects[i] (null = none). */
  demerits: (string | null)[];
  /** True when the group carries a Deep-only effect (stat swap, curse, …). */
  deep: boolean;
}

/**
 * Re-join effects that wrap onto a second screen line ("[Raider] Damage
 * taken while using Character Skill" / "improves attack power and stamina").
 * A pair is joined only when the joined text matches an effect better than
 * either half does alone — a complete line never gains from a join, so
 * whole effects and their neighbors are left untouched. Relic-name lines
 * head their groups and are never absorbed into a join.
 */
function joinWrappedLines(lines: string[]): string[] {
  const match = (s: string) => (s.length < 8 ? null : bestEffectMatch(s, 0.3));
  // A demerit renders as its own line under its effect — joining across it
  // would swallow the curse, so a curse-matching half is never joined.
  const isCurseLine = (m: EffectMatch | null) => m != null && m.score >= 0.55 && CURSE_EFFECTS.has(m.effect);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i].trim();
    const b = i + 1 < lines.length ? lines[i + 1].trim() : "";
    if (!b || (a.length >= 8 && bestMatch(a, RELIC_NAME_VOCABULARY, 0.62))) {
      out.push(a);
      continue;
    }
    const mA = match(a);
    const mB = match(b);
    const joined = `${a} ${b}`;
    const mJ = joined.length < 8 ? null : bestEffectMatch(joined, 0.3);
    if (
      mJ && mJ.score >= 0.8 &&
      mJ.score > (mA?.score ?? 0) && mJ.score > (mB?.score ?? 0) &&
      !isCurseLine(mA) && !isCurseLine(mB)
    ) {
      out.push(joined);
      i++;
    } else {
      out.push(a);
    }
  }
  return out;
}

/**
 * Cluster OCR lines into relic groups. A line matching a relic name starts a
 * new group; effect lines attach to the current group (max 3 per relic, as in
 * game). A curse line is the demerit of the effect directly above it. Returns
 * at most `maxGroups` groups that contain something.
 */
export function parseRelicGroups(lines: string[], maxGroups = 6): ParsedRelicGroup[] {
  const groups: ParsedRelicGroup[] = [];
  let current: ParsedRelicGroup | null = null;
  const push = (g: ParsedRelicGroup) => {
    if (groups.length < maxGroups) groups.push(g);
    return g;
  };

  for (const raw of joinWrappedLines(lines)) {
    const line = raw.trim();
    if (line.length < 8) continue;
    const asName = bestMatch(line, RELIC_NAME_VOCABULARY, 0.62);
    const asEffect = bestEffectMatch(line, 0.5);
    if (asName && (!asEffect || asName.score >= asEffect.score)) {
      current = push({ name: asName.effect, effects: [], demerits: [], deep: /^deep /i.test(asName.effect) });
    } else if (asEffect) {
      // A demerit rides with the effect above it, not as its own line.
      if (CURSE_EFFECTS.has(asEffect.effect)) {
        if (current && current.effects.length > 0) {
          current.demerits[current.effects.length - 1] = asEffect.effect;
        }
        continue;
      }
      if (!current || current.effects.length >= 3) {
        current = push({ name: null, effects: [], demerits: [], deep: false });
      }
      // Skip duplicates within a group (OCR sometimes doubles lines).
      if (!current.effects.some((e) => e.effect === asEffect.effect)) {
        current.effects.push(asEffect);
        current.demerits.push(null);
      }
    }
  }
  for (const g of groups) {
    g.deep =
      g.deep ||
      g.effects.some((e) => DEEP_ONLY_EFFECTS.has(e.effect)) ||
      g.demerits.some(Boolean);
  }
  return groups.filter((g) => g.name !== null || g.effects.length > 0);
}

/**
 * Whether a parsed screenshot shows Deep relics. A screenshot is all-Deep
 * or all-normal, so the majority of groups decides — one spurious
 * deep-only match on a normal screen can't flip the whole import.
 */
export function screenIsDeep(groups: ParsedRelicGroup[]): boolean {
  return groups.filter((g) => g.deep).length * 2 > groups.length;
}
