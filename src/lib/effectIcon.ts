// ─────────────────────────────────────────────────────────────────────────
//  The small glyph the game shows beside a relic effect line (sword =
//  attack, armor = negation, bag = items …). Resolution is two-stage:
//
//    1. effectIconTable — effect names paired with their icon on Eldenpedia,
//       which mirrors what the game actually displays. Authoritative.
//    2. guessEffectIcon — keyword rules, for text the table doesn't carry:
//       catalogue entries the wiki hasn't tagged, "[Weapon]" placeholder
//       rows, Deep demerits, and whatever a user types or OCR reads off a
//       screenshot.
//
//  Both stages are shared with scripts/effect-icons.ts, which regenerates
//  the table and scores the rules against it — see that script's header.
// ─────────────────────────────────────────────────────────────────────────

import { effectIconTable } from "@/data/effectIcons";

/** Icon slugs, matching the filenames in public/icons/effects/. */
export const EFFECT_ICONS = [
  "ability",
  "attack-down",
  "attack-up",
  "basic-action",
  "character-skill",
  "defense-down",
  "defense-up",
  "enemy-attention",
  "fp-down",
  "fp-up",
  "hp-down",
  "hp-up",
  "item-down",
  "item-up",
  "projectile-up",
  "rune-loss-prevention",
  "spell-up",
  "stamina-down",
  "stamina-up",
  "ultimate-art",
  "ultimate-art-down",
  "weapon-skill-up",
] as const;

export type EffectIcon = (typeof EFFECT_ICONS)[number];

/** What each icon stands for — the tooltip, and the alt text where it matters. */
export const EFFECT_ICON_LABELS: Record<EffectIcon, string> = {
  ability: "Ability",
  "attack-down": "Attack power (reduced)",
  "attack-up": "Attack power",
  "basic-action": "Basic action",
  "character-skill": "Character Skill",
  "defense-down": "Damage negation (reduced)",
  "defense-up": "Damage negation",
  "enemy-attention": "Enemy attention",
  "fp-down": "FP (reduced)",
  "fp-up": "FP",
  "hp-down": "HP (reduced)",
  "hp-up": "HP",
  "item-down": "Items (reduced)",
  "item-up": "Items",
  "projectile-up": "Projectiles",
  "rune-loss-prevention": "Runes",
  "spell-up": "Sorcery & Incantation",
  "stamina-down": "Stamina (reduced)",
  "stamina-up": "Stamina",
  "ultimate-art": "Ultimate Art",
  "ultimate-art-down": "Ultimate Art (reduced)",
  "weapon-skill-up": "Weapon Skill",
};

/**
 * Lookup key for an effect name: case/punctuation-insensitive, and blind to
 * whether a character effect is written "[Duchess] …" or "Duchess: …".
 */
export function effectIconKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/&/g, "and")
    .replace(/^\[([a-z]+)\]\s*/, "$1 ")
    .replace(/^([a-z]+):\s*/, "$1 ")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A downgrade, which takes the downward-arrow variant of its icon. Deliberately
 * narrow: "Reduced FP Consumption" is a *benefit*, and a stat swap ("Improved
 * Mind, Reduced Vigor") is named for what it improves, so neither counts.
 */
function isDown(key: string): boolean {
  // "Blood loss" is an ailment you inflict, not a downgrade — drop it before
  // the test, or "Starting armament inflicts blood loss" reads as a demerit.
  const text = key.replace(/blood loss/g, "");
  if (/\bimproved\b/.test(text)) return false;
  // "Reduced FP Consumption", "reduced rune loss" — less of a bad thing.
  if (/reduc\w*\s+(\w+\s+){0,2}(consumption|cost|cooldown|loss|penalty)/.test(text)) return false;
  return /\b(down|decreas\w*|reduc\w*|lower\w*|impair\w*|weakened|worsen\w*|loss|loses)\b/.test(text);
}

const DOWN_VARIANT: Partial<Record<EffectIcon, EffectIcon>> = {
  "attack-up": "attack-down",
  "defense-up": "defense-down",
  "hp-up": "hp-down",
  "fp-up": "fp-down",
  "stamina-up": "stamina-down",
  "item-up": "item-down",
  "ultimate-art": "ultimate-art-down",
};

/**
 * Which icon a stat belongs to — the game groups stats by what they drive,
 * not by the stat itself (Faith reads as a spell effect, Mind as an FP one).
 */
const STATS: [RegExp, EffectIcon][] = [
  [/\bvigor\b/, "hp-up"],
  [/\bmind\b/, "fp-up"],
  [/\bendurance\b/, "stamina-up"],
  [/\b(intelligence|faith)\b/, "spell-up"],
  [/\b(strength|dexterity|arcane)\b/, "attack-up"],
];

/**
 * Keyword rules, most specific first — order is where the meaning lives.
 * Tuned against the wiki's own labels, whose conventions are not always the
 * obvious ones: throwing pots and greases are *item* effects, anything that
 * mentions guarding takes the icon of what it grants rather than a shield,
 * and rune gain is an item effect (the rune glyph is only for rune loss).
 * scripts/effect-icons.ts scores these rules against every wiki pair.
 */
const RULES: [RegExp, EffectIcon | "stat-swap" | "stat-loss"][] = [
  // Ultimate Art first: an art effect that mentions attacks or guarding is
  // still an art effect. ("gague" is a recurring wiki typo.)
  [/ultimate art|\bart ga[gu]+ge|\bart\b.*(activat|active|execut|charg|fill)|activat.*\bart\b/, "ultimate-art"],
  [/character skill|\bskill use|skill cooldown|weak point/, "character-skill"],
  // Stat lines are named for the stat, and read before anything else they
  // mention: a swap by what it grants, a pure demerit by what it costs.
  [/\bimproved\b[^,]*\breduced\b|\bimproved\b.*,\s*reduced\b/, "stat-swap"],
  [/^reduced\b|^\[?\w+\]?\s*reduced\b/, "stat-loss"],
  // A line about attack going down is an attack line, whatever it names as
  // the trigger ("Lower Attack When Below Max HP").
  [/lower\w* attack|attack\w*( power)? (is )?(lower|reduc|down)/, "attack-down"],
  [
    /in possession at start of expedition|helps discover|boluses|cured meat|perfuming|gravity stone|glintstone scrap|throwing (pot|knife|stone|dart)/,
    "item-up",
  ],
  // The resource an effect restores wins over whatever triggers it: "HP
  // Restoration upon Halberd Attacks" is an HP line, not an attack one.
  [/\bfp\b|flask of cerulean/, "fp-up"],
  [
    /hp restoration|restores? hp|hp recovery|recover\w* hp|max\w* hp|hp loss|loses? hp|\bheal|revival|resurrect|flask of crimson|\bvigor\b/,
    "hp-up",
  ],
  [/stamina/, "stamina-up"],
  [/sorcer|incantation|spell|glintstone|\bstaff|staves|sacred seal|memory slot/, "spell-up"],
  [/weapon skill|ash of war|\bskill\b/, "weapon-skill-up"],
  [/rune loss|losing runes|retain runes/, "rune-loss-prevention"],
  [/earn runes|rune acquisition|rune gain|runes? up|discovery/, "item-up"],
  [/enemy attention|aggression|aggro|target of enemy/, "enemy-attention"],
  // Damage *taken* is a negation effect; damage *dealt* is an attack one.
  [/(more|increased) damage taken|damage taken (is )?(up|increased)|ailments cause increased damage/, "defense-down"],
  [/negation|resistance|\bresist\b|defen[cs]e|\bpoise\b|robustness|immunity|vitality/, "defense-up"],
  [/guard counter|stance|charged attack|critical hit|\battacks?\b|attack power|\bdamage\b/, "attack-up"],
  [/\bitem|treasure|\bmap\b|\bkey\b|flask|pouch|talisman|craft|merchant|shop|smithing|\brune/, "item-up"],
  [/dodge|\broll|sprint|\bjump|crouch|movement|footsteps|difficult to spot|conceal/, "basic-action"],
];

/** The stat a clause is about — the last one named, which is the one the game titles it by. */
function statIcon(clause: string): EffectIcon | null {
  let best: EffectIcon | null = null;
  let at = -1;
  for (const [stat, icon] of STATS) {
    const m = clause.match(stat);
    if (m && m.index !== undefined && m.index > at) {
      at = m.index;
      best = icon;
    }
  }
  return best;
}

/** Best-guess icon from the effect text alone. Null when nothing fits. */
export function guessEffectIcon(name: string): EffectIcon | null {
  const key = effectIconKey(name);
  for (const [rule, icon] of RULES) {
    if (!rule.test(key)) continue;
    if (icon === "stat-swap") {
      const gained = key.slice(key.indexOf("improved")).split("reduced")[0];
      return statIcon(gained) ?? "attack-up";
    }
    if (icon === "stat-loss") {
      const lost = statIcon(key);
      // "Reduced …" only means a stat penalty when a stat is named — otherwise
      // it's something else entirely ("Reduced FP Consumption" is a benefit),
      // so let the later rules have it.
      if (!lost) continue;
      // Only attack/defense/HP/FP/stamina have a down variant; a lost spell
      // stat falls back to the attack demerit, as the game does.
      return DOWN_VARIANT[lost] ?? "attack-down";
    }
    return (isDown(key) && DOWN_VARIANT[icon]) || icon;
  }
  // Plain stat lines ("Faith +2") reach here with nothing else to go on.
  return statIcon(key);
}

/** The icon for an effect line: wiki-confirmed where known, else guessed. */
export function effectIcon(name: string): EffectIcon | null {
  const key = effectIconKey(name);
  const known = effectIconTable[key];
  if (known) {
    // A demerit reuses its effect's icon with the arrow flipped ("Physical
    // Attack Down" shares a table entry with "Physical Attack Up").
    return (isDown(key) && DOWN_VARIANT[known]) || known;
  }
  return guessEffectIcon(name);
}
