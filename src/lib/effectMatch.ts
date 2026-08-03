// ─────────────────────────────────────────────────────────────────────────
//  Effect vocabulary + fuzzy matching for the screenshot importer. OCR output
//  is noisy, but relic effects are a closed vocabulary — snapping each OCR
//  line to its nearest known effect turns sloppy text into clean data.
// ─────────────────────────────────────────────────────────────────────────

import { deepRelics } from "@/data/deepRelics";
import { relicEffects } from "@/data/relicEffects";
import { characterSwaps } from "@/data/statSwaps";
import { uniqueRelics, type UniqueRelicColor } from "@/data/uniqueRelics";
import { gameEffectName, type RelicCategory } from "@/lib/relics";
import { swapEffectName } from "@/lib/statSwaps";

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
/**
 * Relic lines name a status the short way wherever one appears — "Improved
 * Rot Resistance", "Taking Damage Causes Frost Buildup" (both verified
 * in-game, and the resistances are the normal catalogue's spelling too). The
 * wiki writes two of them out in full; those are alias phrasings below.
 */
const STATUSES = ["Poison", "Rot", "Blood Loss", "Frost", "Sleep", "Madness", "Death Blight"];
const STATUS_LEGACY: Record<string, string> = { Rot: "Scarlet Rot", Frost: "Frostbite" };

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
/** In-game status wording → the catalogue's old abbreviation, kept as an alias. */
const AFFLICTED_LEGACY: Record<string, string> = {
  poison: "Poison", "scarlet rot": "Rot", frostbite: "Frost",
};
const AFFLICTED = Object.keys(AFFLICTED_LEGACY).map((s) => `Attack power up when facing ${s}-afflicted enemy`);

/**
 * The concrete names behind the Deep catalogue's grouped rows are taken from
 * the normal catalogue rather than respelled here, so one effect keeps one
 * spelling across both pools.
 */
const catalogueNames = (category: RelicCategory, prefix = "") =>
  relicEffects.filter((e) => e.category === category && e.name.startsWith(prefix)).map((e) => e.name);

const NAME_GROUPS: [string, string[]][] = [
  ["Magic/Fire/Lightning/Holy Attack Up", ELEMENTS.map((e) => `${e} Attack Power Up`)],
  ["Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy", AFFLICTED],
  ["Attack power up when facing frostbite/poison/scarlet rot-afflicted enemy", AFFLICTED],
  ["Sleep/Madness in Vicinity Improves Attack Power",
    ["Sleep", "Madness"].map((s) => `${s} in Vicinity Improves Attack Power`)],
  // The game shows these as separate per-spell-type lines ("Improved
  // Sorceries +1" — seen on a Deep relic in-game).
  ["Improved Sorceries/Incantations", ["Improved Sorceries", "Improved Incantations"]],
  // Three of the four carry "Damage"; the perfume line is just "Improved
  // Perfuming Arts" in game, which is also the normal catalogue's name — so
  // spelling it the sheet's way left the Deep tiers on an effect of their own.
  ["Improved [Consumable] Damage",
    ["Improved Throwing Pot Damage", "Improved Throwing Knife Damage",
     "Improved Throwing Stone Damage", "Improved Perfuming Arts"]],
  // The sheet folded whole pools into a single row. "[Spell School]" is no
  // token expandName knows, so the placeholder went into the vocabulary
  // verbatim: every school was missing from the Deep pool (the build page
  // found nothing for "gravity") while the placeholder itself sat there as a
  // match target for OCR to snap a real school line onto.
  ["Improved [Spell School] Sorcery/Incantation", catalogueNames("spell-school")],
  ["Max FP Up with 3+ Staves/Seals Equipped", catalogueNames("loadout", "Max FP")],
  ["Max HP Up with 3+ Shields Equipped", catalogueNames("loadout", "Max HP")],
];

/** "Foo +3/4" → ["Foo +3", "Foo +4"]; names without a tier group pass through. */
function splitTierSuffix(name: string): string[] {
  const m = name.match(/^(.+?) \+(\d(?:\/\+?\d)+)$/);
  if (!m) return [name];
  return m[2].split("/").map((t) => `${m[1]} +${t.replace(/^\+/, "")}`);
}

function expandTemplates(name: string): string[] {
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

/**
 * "+0" never reaches a relic — the game drops the suffix and prints the base
 * tier as a bare line (verified in game). The community sheet wrote it, so it
 * comes off during expansion: one name per effect, the one the screen shows.
 *
 * That name is often already the normal pool's, which is the point — a Deep
 * relic's base-tier line and the normal effect are one line, so the build
 * page can offer it on a Deep relic and the matcher isn't picking between two
 * spellings that sit equally close to a scanned row. The "+0" spelling stays
 * an alias below, so relics saved under it convert on their next load.
 */
function dropZeroTier(name: string): string {
  return name.replace(/ \+0$/, "");
}

function expandName(name: string): string[] {
  return expandTemplates(name).map(dropZeroTier);
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

// Character effects canonicalize to the game's "[Duchess] …" tag even where
// the catalogue writes "Duchess: …", so the vocabulary, the matcher and the
// text saved on a relic all speak one spelling (the colon form stays an
// accepted alias below).
const CANONICAL_BY_KEY = new Map<string, string>();
for (const name of [
  ...relicEffects.map((e) => e.name),
  ...deepRelics.map((e) => e.name),
  ...uniqueRelics.flatMap((r) => r.effects),
].flatMap(expandName).map(gameEffectName)) {
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
  // The game's own line for the crit → Art gauge effect (seen in-game
  // 2026-08-02); the catalogue keeps the community sheet's wording, which is
  // the odd one out of the three "…fills more of the Art gauge" lines.
  "Critical hits fill more of the Art gauge": "Art gauge fills moderately upon critical hit",
  "Extended Spell Duration": "Extend Spell Duration",
  "Max stamina increased for each great enemy defeated at a Great Encampment":
    "Max Stamina increased per Great Encampment boss",
  "[Raider] Hit With Character Skill to Reduce Enemy Attack Power":
    "[Raider] Hit With Skill to Reduce Enemy Attack Power",
  // Seen in-game 2026-08-03 (yt-4/yt-6 fixtures): the game writes "Character
  // Skill" where the catalogue shortens to "Skill".
  "[Guardian] Character Skill Boosts Damage Negation of Nearby Allies":
    "[Guardian] Skill Boosts Damage Negation of Nearby Allies",
  // The catalogue's shorthand for the line the game writes out in full — the
  // in-game wording is the displayed name now, so this runs the other way.
  "[Undertaker] Attack Power Increased by Landing Chain Attack":
    "[Undertaker] Attack power increased by landing the final blow of a chain attack",
  // Same effect, near-opposite sentence: the catalogue leads with the dagger,
  // the game leads with the reprise. Nothing lexical survives the reordering,
  // so without this it lost to the Undertaker line above, which happens to
  // share "by landing the final blow of a chain attack" word for word.
  "[Duchess] Reprise events upon nearby enemies by landing the final blow of a chain attack with dagger":
    "[Duchess] Dagger chain attack reprises event upon nearby enemies",
};

// "Ultimate Art Gauge +N" was the community sheet's name for a line the game
// calls Ultimate Art Auto Charge — wording that appears nowhere in game. The
// catalogue now carries the real name, so the sheet's is an alias: relics
// saved under it convert on their next load, and wiki-styled input still
// matches.
for (const n of [1, 2, 3]) {
  EFFECT_ALIASES[`Ultimate Art Gauge +${n}`] = `Ultimate Art Auto Charge +${n}`;
}

/** "Great Hammer" → "Great Hammers", "Torch" → "Torches"; "Staves" stays. */
function pluralizeWeapon(w: string): string {
  if (w.endsWith("s")) return w;
  return /(ch|sh|x)$/.test(w) ? `${w}es` : `${w}s`;
}

// The game spells out "and" where the catalogue writes "&" (in either stat
// order — it shows "Reduced Intelligence and Dexterity" for the catalogue's
// "Reduced Dexterity & Intelligence"). Character tags run the other way now
// that "[Duchess] …" is canonical: the catalogue's "Duchess: …" spelling is
// the alias, so older saved text and wiki-styled input still match.
for (const name of EFFECT_VOCABULARY) {
  if (name.includes(" & ")) EFFECT_ALIASES[name.replace(/ & /g, " and ")] = name;
  const pair = name.match(/^Reduced ([A-Za-z]+) & ([A-Za-z]+)$/);
  if (pair) EFFECT_ALIASES[`Reduced ${pair[2]} and ${pair[1]}`] = name;
  const tagged = name.match(/^\[([A-Za-z]+)\] (.+)$/);
  if (tagged) EFFECT_ALIASES[`${tagged[1]}: ${tagged[2]}`] = name;
  // The afflicted-enemy and grease effects are named for what the game shows,
  // so here the *catalogue's* old abbreviations are the aliases — kept so
  // relics saved before the rename, and wiki-styled input, still match. The
  // deep tiers had no alias at all under the old naming ("Frost-Afflicted"
  // where the game says frostbite; "Attack Power Up After Using Grease"
  // against a sentence the game writes out in full), so a tiered line fell
  // back on the untiered normal entry and silently lost its tier.
  const afflicted = name.match(/^Attack power up when facing ([a-z ]+)-afflicted enemy( \+\d)?$/);
  if (afflicted && AFFLICTED_LEGACY[afflicted[1]]) {
    EFFECT_ALIASES[`Attack Power Up vs ${AFFLICTED_LEGACY[afflicted[1]]}-Afflicted Enemy${afflicted[2] ?? ""}`] = name;
  }
  const grease = name.match(/^Physical attack power increases after using grease items( \+\d)?$/);
  if (grease) {
    EFFECT_ALIASES[`Attack Power Up After Using Grease${grease[1] ?? ""}`] = name;
    if (!grease[1]) EFFECT_ALIASES["Attack power increases after using grease items"] = name;
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
  // The elemental negation lines read "Improved Fire Damage Negation" in
  // game, with the tiers above them spelled the same way; the normal
  // catalogue's "Fire Damage Negation Up" was the sheet's wording, so it is
  // the alias now (the base tier is the only one it ever named).
  const elemNeg = name.match(/^Improved (Magic|Fire|Lightning|Holy) Damage Negation$/);
  if (elemNeg) EFFECT_ALIASES[`${elemNeg[1]} Damage Negation Up`] = name;
  // Two lines the two pools spelled differently, each settled on the game's
  // wording: the guard-counter one keeps the normal catalogue's sentence, the
  // stamina one takes the Deep catalogue's — so each pool's other spelling is
  // now the alias, and relics saved under it convert on their next load.
  if (name === "Guard counter is given a boost based on current HP") {
    EFFECT_ALIASES["Guard Counter Boosted by Current HP"] = name;
  }
  const stamina = name.match(/^Stamina Recovery upon Landing Attacks( \+\d)?$/);
  if (stamina) {
    EFFECT_ALIASES[`Stamina recovers with each successful attack${stamina[1] ?? ""}`] = name;
  }
  // The wiki spells two statuses out in full where the game abbreviates them
  // on relic lines — "Improved Scarlet Rot Resistance", "… Frostbite
  // Buildup". Its spelling is the alias, on every line that names one and at
  // every tier, so relics saved under the old resistance names convert too.
  for (const [short, full] of Object.entries(STATUS_LEGACY)) {
    const word = new RegExp(`\\b${short}\\b`);
    if (word.test(name)) EFFECT_ALIASES[name.replace(word, full)] = name;
  }
  // The sheet grouped the perfume line with the three throwing-item ones and
  // gave it their "Damage" suffix; in game it is just "Improved Perfuming
  // Arts". Its spelling is the alias, tier and all.
  const perfume = name.match(/^Improved Perfuming Arts( \+\d)?$/);
  if (perfume) EFFECT_ALIASES[`Improved Perfuming Arts Damage${perfume[1] ?? ""}`] = name;
  // The two Art-gauge fill effects are named for the line the game shows
  // ("Successful guarding fills more of the Art gauge"); the community
  // sheet's shorthand for them, which the catalogue used to display, is the
  // alias — so relics saved under it convert on their next load.
  const gauge = name.match(/^(Successful guarding|Defeating enemies) fills more of the Art gauge( \+\d)?$/);
  if (gauge) {
    const sheet =
      gauge[1] === "Successful guarding"
        ? "Art Gauge Charged from Successful Guarding"
        : "Defeating Enemies Fills More Art Gauge";
    EFFECT_ALIASES[`${sheet}${gauge[2] ?? ""}`] = name;
  }
}

// The other side of dropZeroTier: the sheet's "+0" spelling, kept so
// wiki-styled input and relics saved under it still resolve. Only the Deep
// rows that carry a "+0" get one — an alias per untiered effect would hand
// OCR a pile of targets no relic ever shows.
for (const d of deepRelics) {
  for (const n of expandTemplates(d.name)) {
    if (n.endsWith(" +0")) EFFECT_ALIASES[n] = canonicalEffectName(dropZeroTier(n));
  }
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

/**
 * The signboard swap relics carry the same stat-swap lines the Deep catalogue
 * lists, so those lines are normal-legal too — without this a normal loadout
 * holding one would import as a Deep screen.
 */
const SWAP_EFFECT_NAMES = characterSwaps.flatMap((c) => c.swaps.map((s) => swapEffectName(c, s)));

const NORMAL_EFFECT_NAMES = new Set<string>(
  [
    ...relicEffects.map((e) => e.name),
    ...uniqueRelics.flatMap((r) => r.effects),
    ...SWAP_EFFECT_NAMES,
  ].flatMap(expandCanonical),
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

// Matching is pure and the parse path asks the same question over and over —
// joinWrappedLines probes candidate joins, then the pitch and column learners
// and the main loop of parseRelicGroups each consult every line, and the
// eval's --sweep re-parses identical lines dozens of times. Results are
// memoized per vocabulary; nothing mutates a returned match, and a screenshot
// carries ~50 short lines, so the maps stay small.
const matchMemo = new WeakMap<object, Map<string, EffectMatch | null>>();
function memoizedMatch(vocab: object, key: string, compute: () => EffectMatch | null): EffectMatch | null {
  let cache = matchMemo.get(vocab);
  if (!cache) matchMemo.set(vocab, (cache = new Map()));
  let hit = cache.get(key);
  if (hit === undefined) cache.set(key, (hit = compute()));
  return hit;
}

function bestMatch(line: string, vocab: string[], minScore: number): EffectMatch | null {
  return memoizedMatch(vocab, `${minScore}|${line}`, () => {
    let top: EffectMatch | null = null;
    for (const effect of vocab) {
      const score = similarity(line, effect);
      if (score >= minScore && (!top || score > top.score)) {
        top = { effect, score, line };
      }
    }
    return top;
  });
}

/**
 * Snap a matched effect to the "+N" tier the OCR line actually shows. Fuzzy
 * matching happily lands on a sibling tier (or the tierless base) when the
 * suffix is a single noisy character — but the digit after "+" in the line
 * is the ground truth whenever the corresponding vocabulary entry exists.
 */
function rescueTierSuffix(line: string, top: EffectMatch): EffectMatch {
  const base = top.effect.replace(/ \+\d$/, "");
  const atTier = (n: string): EffectMatch | null => {
    const want = `${base} +${n}`;
    return want !== top.effect && CANONICAL_BY_KEY.has(nameKey(want))
      ? { ...top, effect: canonicalEffectName(want) }
      : null;
  };
  // Only rescue toward a digit the line actually shows — a missing "+N" is
  // usually OCR failing to read the suffix, not proof the effect is tierless.
  const digits = Array.from(line.matchAll(/\+\s?(\d)\b/g));
  if (digits.length > 0) return atTier(digits[digits.length - 1][1]) ?? top;
  // A trailing "+" whose digit OCR dropped still proves the line carries a
  // tier, and the base tier shows no suffix in game — so a line ending that
  // way is neither the tierless entry nor "+0". Where both spellings of an
  // effect exist, those two sit as close to the line as the real tier does,
  // and the tie goes whichever way the vocabulary happens to be ordered.
  if (!/\+\s*$/.test(line.trim()) || / \+[1-9]$/.test(top.effect)) return top;
  return atTier("1") ?? atTier("2") ?? top;
}

/** Every Nightfarer the catalogue tags an effect with, lowercased. */
const CHARACTER_TAGS = new Set<string>(
  EFFECT_VOCABULARY.flatMap((v) => {
    const m = v.match(/^\[([A-Za-z]+)\]/);
    return m ? [m[1].toLowerCase()] : [];
  }),
);

/**
 * The Nightfarer a line is tagged for, in either spelling the app accepts —
 * the game's "[Duchess] …" and the catalogue's "Duchess: …".
 *
 * Not anchored to the start: the effect's category glyph sits left of the tag
 * and OCR routinely reads the two as one token ("[BH [Raider] Damage taken
 * …"), so a tag that must come first is a tag usually missed. What keeps that
 * safe is the roster — only a real Nightfarer's name counts, so the "RUE: "
 * that OCR makes of a scuffed row stays what it is, noise.
 */
function characterTag(text: string): string | null {
  for (const m of Array.from(text.matchAll(/\[([A-Za-z]+)\]|\b([A-Za-z]+):\s/g))) {
    const tag = (m[1] ?? m[2]).toLowerCase();
    if (CHARACTER_TAGS.has(tag)) return tag;
  }
  return null;
}

/**
 * Like bestMatch, but over canonical names + aliases, resolving aliases.
 *
 * A line naming a Nightfarer can only be that Nightfarer's effect. The tag is
 * the most legible thing on the row — a bracketed word at the very start — and
 * the effects behind it are long sentences that overlap heavily between
 * characters, so without this the sentence outvotes the name: the game's
 * "[Duchess] Reprise events … by landing the final blow of a chain attack"
 * matched "[Undertaker] Attack power increased by landing the final blow of a
 * chain attack", which shares that clause word for word.
 */
function bestEffectMatch(line: string, minScore: number): EffectMatch | null {
  return memoizedMatch(MATCH_ENTRIES, `${minScore}|${line}`, () => {
    const tag = characterTag(line);
    let top: EffectMatch | null = null;
    for (const entry of MATCH_ENTRIES) {
      const entryTag = characterTag(entry.text);
      // An untagged entry stays eligible for a tagged line: OCR reads the tag
      // off some rows and not others, and a tagged line that matches nothing
      // is worse than one matched to a general effect.
      if (tag && entryTag && entryTag !== tag) continue;
      const score = similarity(line, entry.text);
      if (score >= minScore && (!top || score > top.score)) {
        top = { effect: entry.canonical, score, line };
      }
    }
    return top ? rescueTierSuffix(line, top) : null;
  });
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

/** A line fed to the parser: bare text, or text with its screen position. */
export interface ParseLine {
  text: string;
  bbox?: { x0: number; y0: number; x1: number; y1: number } | null;
}

/**
 * Re-join effects that wrap onto a second screen line ("[Raider] Damage
 * taken while using Character Skill" / "improves attack power and stamina").
 * A pair is joined only when the joined text matches an effect better than
 * either half does alone — a complete line never gains from a join, so
 * whole effects and their neighbors are left untouched. Relic-name lines
 * head their groups and are never absorbed into a join.
 */
function joinWrappedLines(lines: ParseLine[]): ParseLine[] {
  const match = (s: string) => (s.length < 8 ? null : bestEffectMatch(s, 0.3));
  // A demerit renders as its own line under its effect — joining across it
  // would swallow the curse, so a curse-matching half is never joined.
  const isCurseLine = (m: EffectMatch | null) => m != null && m.score >= 0.55 && CURSE_EFFECTS.has(m.effect);
  const out: ParseLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i].text.trim();
    const b = i + 1 < lines.length ? lines[i + 1].text.trim() : "";
    if (!b || (a.length >= 8 && bestMatch(a, RELIC_NAME_VOCABULARY, 0.62))) {
      out.push({ ...lines[i], text: a });
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
      const ba = lines[i].bbox;
      const bb = lines[i + 1].bbox;
      out.push({
        text: joined,
        bbox: ba && bb
          ? { x0: Math.min(ba.x0, bb.x0), y0: Math.min(ba.y0, bb.y0), x1: Math.max(ba.x1, bb.x1), y1: Math.max(ba.y1, bb.y1) }
          : ba ?? bb,
      });
      i++;
    } else {
      out.push({ ...lines[i], text: a });
    }
  }
  return out;
}

/**
 * An empty effect slot renders on the vessel detail pane as a small hollow
 * icon followed by a bare "-". OCR reads the icon *with* the dash as often as
 * it reads the dash alone — especially off a photo of a screen — and the icon
 * comes back as whatever box-like glyphs it resembles: "[]-", "L] -", "O -".
 * Matching only the lone dash left those rows looking like ordinary unread
 * text, which is enough to hide the blank span that separates two relics and
 * so to run them together into one.
 *
 * Short, dash-bearing and wordless is the whole test. A real effect line is
 * none of the three, and the shortest ones that come close ("Poise +3",
 * "Faith +2") carry no dash at all.
 */
function isEmptySlotRow(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > 8) return false;
  if (!/[-–—‑−~=]/.test(t)) return false;
  // Two letters or digits running together is a word, not icon noise.
  return !/[a-z0-9]{2}/i.test(t);
}

/**
 * The same row, judged strictly enough to end a relic on. Screens carry
 * plenty of short junk that reads as a rule or a stray mark — a lone "=" or
 * "~" turns up mid-relic on noisy captures — and ending a relic on one of
 * those splits it in two. The blank slot itself is always a *dash*, so only
 * a dash is allowed to close the list; the looser test above still keeps the
 * rest of that junk from filling the gap it leaves behind.
 */
function isBlankSlotDash(text: string): boolean {
  return isEmptySlotRow(text) && /[-–—‑−]/.test(text);
}

/**
 * The geometry thresholds parseRelicGroups clusters with, in units of the
 * learned line pitch. The defaults are what the app ships with; the eval's
 * --sweep mode grids over them, which is the only reason they're exposed.
 */
export interface RelicGroupTuning {
  /** y-step from the previous row that starts a new relic. */
  boundaryStepPitches?: number;
  /** Truly empty vertical span that ends a relic (blank slot + divider). */
  blankSpanPitches?: number;
}

/**
 * Cluster OCR lines into relic groups. A line matching a relic name starts a
 * new group; effect lines attach to the current group (max 3 per relic, as in
 * game). A curse line is the demerit of the effect directly above it. When
 * line positions are provided, a vertical gap much taller than a line also
 * starts a new group — relic blocks are visibly separated on every screen,
 * so one unreadable line can't spill the next relic's effects into this one.
 * Returns at most `maxGroups` groups that contain something.
 */
export function parseRelicGroups(
  lines: (string | ParseLine)[],
  maxGroups = 6,
  tuning?: RelicGroupTuning,
): ParsedRelicGroup[] {
  // Defaults from the eval's --sweep over the 40-fixture set (2026-08-03):
  // the boundary step is flat from 1.8–2.6 pitches so 2.4 sits mid-plateau;
  // the blank span peaks on 1.02–1.08 with cliffs both at 1.0 (false splits)
  // and past 1.1 (real boundaries missed), so 1.05 is the plateau's center.
  const boundaryStepPitches = tuning?.boundaryStepPitches ?? 2.4;
  const blankSpanPitches = tuning?.blankSpanPitches ?? 1.05;
  const norm: ParseLine[] = lines.map((l) => (typeof l === "string" ? { text: l } : l));
  const groups: ParsedRelicGroup[] = [];
  let current: ParsedRelicGroup | null = null;
  const push = (g: ParsedRelicGroup) => {
    if (groups.length < maxGroups) groups.push(g);
    return g;
  };

  const joined = joinWrappedLines(norm);
  // Learn the screen's line pitch from the lines that will actually parse:
  // the median vertical step between consecutive recognized lines. Block
  // boundaries then show up as steps far larger than the pitch.
  const acceptedYs = joined
    .filter((l) => {
      const t = l.text.trim();
      if (t.length < 8 || !l.bbox) return false;
      if (bestMatch(t, RELIC_NAME_VOCABULARY, 0.62) !== null) return true;
      const m = bestEffectMatch(t, 0.5);
      // A demerit sits sub-row-height under its effect — counting it would
      // drag the learned pitch below the real row spacing.
      return m !== null && !CURSE_EFFECTS.has(m.effect);
    })
    .map((l) => l.bbox!.y0)
    .sort((a, b) => a - b);
  const steps = acceptedYs.slice(1).map((y, i) => y - acceptedYs[i]).filter((s) => s > 0).sort((a, b) => a - b);
  const pitch = steps[steps.length >> 1] ?? 0;
  // Where the effect column starts, so an empty-slot row can be told from a
  // dash somewhere else on screen — the button hints along the bottom, the
  // "R1" chrome at the top. Rows in this column belong to the relic list.
  const acceptedX0s = joined
    .filter((l) => {
      const t = l.text.trim();
      if (t.length < 8 || !l.bbox) return false;
      return (
        bestMatch(t, RELIC_NAME_VOCABULARY, 0.62) !== null || bestEffectMatch(t, 0.5) !== null
      );
    })
    .map((l) => l.bbox!.x0)
    .sort((a, b) => a - b);
  const columnX = acceptedX0s[acceptedX0s.length >> 1] ?? 0;
  let prevBox: ParseLine["bbox"] = null;

  // Whether OCR read *anything* — junk included — in the same column between
  // two line boxes. An unread-but-present line (a mangled effect) still
  // occupies its row, so only a truly blank slot leaves the span empty.
  // Dash-only lines are the blank slots themselves, so they don't count.
  //
  // Only a line the parser would *consider* as content can occupy a row. It
  // skips anything under 8 characters outright, so a two-character smudge
  // can't be treated as an effect — and it must not be what stands between
  // two relics either. That asymmetry is what ran relics together on photos
  // of a TV: the blank row between them came back as "Er", too short to be an
  // effect but long enough to fill the gap that was the only boundary left
  // once the dash itself went unread.
  const boxes = joined
    .filter((l) => l.text.trim().length >= 8 && !isEmptySlotRow(l.text))
    .map((l) => l.bbox)
    .filter((b): b is NonNullable<ParseLine["bbox"]> => b != null);
  const spanIsEmpty = (above: NonNullable<ParseLine["bbox"]>, below: NonNullable<ParseLine["bbox"]>) =>
    !boxes.some((b) => {
      if (b === above || b === below) return false;
      const cy = (b.y0 + b.y1) / 2;
      return cy > above.y1 && cy < below.y0 && b.x1 > below.x0 && b.x0 < below.x1;
    });

  for (const pl of joined) {
    const line = pl.text.trim();
    // An empty slot means the relic's effect list has ended: effects fill
    // top-down, so whatever follows belongs to the next relic. This is the
    // one boundary the screen states outright, so it's taken over the
    // geometry below — the blank-span check needs a clean read of the gap,
    // and a noisy capture is exactly where it stops getting one.
    //
    // A dash elsewhere on screen must not close anything, so with positions
    // to hand the row has to sit in the effect column to count; without them
    // (line lists carry no boxes) the marker is all there is to go on.
    if (isBlankSlotDash(line)) {
      const inColumn =
        !pl.bbox || pitch === 0 || Math.abs(pl.bbox.x0 - columnX) <= Math.max(pitch, 40);
      if (inColumn && current && current.effects.length > 0) current = null;
      continue;
    }
    if (line.length < 8) continue;
    const asName = bestMatch(line, RELIC_NAME_VOCABULARY, 0.62);
    const asEffect = bestEffectMatch(line, 0.5);
    if (asName && (!asEffect || asName.score >= asEffect.score)) {
      current = push({ name: asName.effect, effects: [], demerits: [], deep: /^deep /i.test(asName.effect) });
      prevBox = pl.bbox ?? prevBox;
    } else if (asEffect) {
      // A demerit rides with the effect above it, not as its own line.
      if (CURSE_EFFECTS.has(asEffect.effect)) {
        if (current && current.effects.length > 0) {
          current.demerits[current.effects.length - 1] = asEffect.effect;
          prevBox = pl.bbox ?? prevBox;
        }
        continue;
      }
      // A step of ~2 pitches is a missing line inside the block; a relic
      // boundary is a clearly larger jump.
      const step = pl.bbox && prevBox && pitch > 0 ? pl.bbox.y0 - prevBox.y0 : 0;
      // A truly empty vertical span taller than the row pitch is a blank
      // slot (plus the divider after it), so it ends the relic even when
      // the y-step alone stays under the boundary threshold above.
      const blankAbove =
        pl.bbox != null &&
        prevBox != null &&
        pitch > 0 &&
        pl.bbox.y0 - prevBox.y1 > blankSpanPitches * pitch &&
        spanIsEmpty(prevBox, pl.bbox);
      if (
        !current ||
        current.effects.length >= 3 ||
        (current.effects.length > 0 && (step > boundaryStepPitches * pitch || blankAbove))
      ) {
        current = push({ name: null, effects: [], demerits: [], deep: false });
      }
      // Skip duplicates within a group (OCR sometimes doubles lines).
      if (!current.effects.some((e) => e.effect === asEffect.effect)) {
        current.effects.push(asEffect);
        current.demerits.push(null);
      }
      prevBox = pl.bbox ?? prevBox;
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

// ── Unique-relic identification ──────────────────────────────────────────
// List screens show a relic's effects but never its name — yet unique relics
// have fixed effect sets, so the effects can name the relic. The anchor rule
// keeps this honest: identification needs at least one parsed effect that
// can never roll on a custom relic (it exists only through uniqueRelics), so
// a custom relic that happens to share common lines with a unique can't be
// mislabeled as one. "Extend Spell Duration" appears on exactly one relic in
// the game; reading it IS reading the name.

/**
 * Effects obtainable outside unique relics — custom rolls plus the signboard
 * swap lines — i.e. everything that must never anchor an identification.
 */
const CUSTOM_ROLLABLE_KEYS = new Set(
  [...relicEffects.map((e) => e.name), ...deepRelics.map((e) => e.name), ...SWAP_EFFECT_NAMES]
    .flatMap(expandName)
    .map((n) => nameKey(gameEffectName(n))),
);

export interface IdentifiedUnique {
  name: string;
  color: UniqueRelicColor;
  /** The relic's full fixed effect list, in canonical vocabulary spelling. */
  effects: string[];
}

/**
 * The unique relic a parsed effect list identifies, or null when nothing is
 * decisive. Requires an anchor (see above) and that the parsed lines don't
 * leave the pick ambiguous: either at least two lines belong to the relic,
 * or every parsed line does (a close-up may only show one). A tie between
 * two uniques — same anchors, same overlap — identifies nothing; OCR noise
 * must never pick a winner.
 */
export function identifyUniqueRelic(parsedEffects: string[]): IdentifiedUnique | null {
  if (parsedEffects.length === 0) return null;
  const parsedKeys = new Set(parsedEffects.map(nameKey));
  let best: { relic: (typeof uniqueRelics)[number]; overlap: number; anchors: number } | null = null;
  let tie = false;
  for (const relic of uniqueRelics) {
    const overlapKeys = relic.effects
      .map((e) => nameKey(gameEffectName(e)))
      .filter((k) => parsedKeys.has(k));
    const anchors = overlapKeys.filter((k) => !CUSTOM_ROLLABLE_KEYS.has(k)).length;
    if (anchors === 0) continue;
    const overlap = overlapKeys.length;
    if (!best || anchors > best.anchors || (anchors === best.anchors && overlap > best.overlap)) {
      best = { relic, overlap, anchors };
      tie = false;
    } else if (anchors === best.anchors && overlap === best.overlap) {
      tie = true;
    }
  }
  if (!best || tie) return null;
  if (best.overlap < 2 && best.overlap < parsedEffects.length) return null;
  return {
    name: best.relic.name,
    color: best.relic.color,
    effects: best.relic.effects.map((e) => canonicalEffectName(gameEffectName(e))),
  };
}

/** A strip of screenshot worth re-OCRing; replaces lines[index] on success. */
export interface RetryStrip {
  index: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Rows worth a second OCR attempt: they sit inside the relic list — in the
 * effect column, vertically among the rows that DID match — but matched
 * nothing themselves. That's a garbled effect ("IB rch) Use Charcot amines"),
 * a demerit read as junk, or a line so lost that OCR left only a smudge of
 * it. Geometry is learned from the matched rows the same way parseRelicGroups
 * learns it, and each strip spans the full column width at the row's height,
 * so a two-word fragment still crops the whole line it sits on. Blank-slot
 * dashes are boundaries, not unread text, and are never candidates — nor is
 * any row sharing its height with a matched line (the good read wins).
 */
export function retryCandidates(lines: ParseLine[]): RetryStrip[] {
  const rows = lines.map((l, index) => ({ index, text: l.text.trim(), bbox: l.bbox ?? null }));
  const matched = rows.filter(
    (r) =>
      r.bbox &&
      r.text.length >= 8 &&
      (bestMatch(r.text, RELIC_NAME_VOCABULARY, 0.62) !== null || bestEffectMatch(r.text, 0.5) !== null),
  );
  if (matched.length < 2) return [];
  // Same pitch learning as parseRelicGroups: median y0 step of matched rows,
  // excluding curse lines, which sit sub-row-height under their effect.
  const ys = matched
    .filter((r) => {
      const m = bestEffectMatch(r.text, 0.5);
      return !(m && CURSE_EFFECTS.has(m.effect));
    })
    .map((r) => r.bbox!.y0)
    .sort((a, b) => a - b);
  const steps = ys.slice(1).map((y, i) => y - ys[i]).filter((s) => s > 0).sort((a, b) => a - b);
  const pitch = steps[steps.length >> 1] ?? 0;
  if (pitch === 0) return [];
  const x0s = matched.map((r) => r.bbox!.x0).sort((a, b) => a - b);
  const columnX = x0s[x0s.length >> 1];
  const columnRight = Math.max(...matched.map((r) => r.bbox!.x1));
  const top = Math.min(...matched.map((r) => r.bbox!.y0)) - 1.2 * pitch;
  const bottom = Math.max(...matched.map((r) => r.bbox!.y1)) + 1.6 * pitch;
  const isMatched = new Set(matched);
  const rowCenter = (b: NonNullable<ParseLine["bbox"]>) => (b.y0 + b.y1) / 2;

  const strips: RetryStrip[] = [];
  for (const r of rows) {
    if (!r.bbox || r.text.length === 0 || isMatched.has(r) || isEmptySlotRow(r.text)) continue;
    const cy = rowCenter(r.bbox);
    if (cy < top || cy > bottom) continue;
    if (r.bbox.x1 < columnX - pitch || r.bbox.x0 > columnRight) continue;
    if (matched.some((m) => Math.abs(rowCenter(m.bbox!) - cy) < 0.5 * pitch)) continue;
    // Two junk fragments on one physical row get one strip, not two.
    if (strips.some((s) => Math.abs((s.y0 + s.y1) / 2 - cy) < 0.5 * pitch)) continue;
    const h = Math.max(r.bbox.y1 - r.bbox.y0, 0.62 * pitch);
    strips.push({
      index: r.index,
      x0: Math.max(0, columnX - 0.2 * pitch),
      y0: Math.max(0, cy - h / 2 - 0.12 * pitch),
      x1: columnRight + 0.2 * pitch,
      y1: cy + h / 2 + 0.12 * pitch,
    });
  }
  return strips;
}

/**
 * Whether re-OCR'd strip text earns a place in the line list: the same bar
 * the parser holds every line to (effect ≥ 0.5, relic name ≥ 0.62), returned
 * as a score so competing preprocessing variants can be ranked. 0 = rejected.
 * This gate is what bounds the retry pass's spurious risk — text that clears
 * it would have been accepted from the main pass too.
 */
export function retryLineScore(text: string): number {
  const t = text.trim();
  if (t.length < 8) return 0;
  return Math.max(
    bestEffectMatch(t, 0.5)?.score ?? 0,
    bestMatch(t, RELIC_NAME_VOCABULARY, 0.62)?.score ?? 0,
  );
}

/**
 * Given the line lists of several OCR passes over the same screenshot (the
 * original plus preprocessed copies), keep the pass whose lines parse into
 * the most confidently-read relics. Preprocessing helps some captures and
 * wrecks others, so the passes compete on results per image rather than one
 * transform being trusted globally. Ties keep the earliest pass.
 */
export function pickBestOcrPass<T extends ParseLine>(passes: T[][]): T[] {
  let best: { lines: T[]; quality: number } | null = null;
  for (const lines of passes) {
    const groups = parseRelicGroups(lines);
    const quality =
      groups.flatMap((g) => g.effects).filter((e) => e.score >= 0.85).length +
      groups.reduce((n, g) => n + g.demerits.filter(Boolean).length, 0) +
      groups.filter((g) => g.name !== null).length;
    if (!best || quality > best.quality) best = { lines, quality };
  }
  return best?.lines ?? [];
}
