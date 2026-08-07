#!/usr/bin/env python3
"""Generate src/data/revive.ts from the community revive-damage spreadsheet.

Usage: python3 scripts/gen-revive.py <dir-with-csvs>

The directory must contain Overview.csv, Standard.csv, Powerstance.csv,
Spells.csv, and Character_Skills.csv, exported per tab from the sheet:
  curl -sL "https://docs.google.com/spreadsheets/d/1w1qkrqrbp3uQ7d4MyYv4CYAWhKfanQnhI2hLf1Fkn6k/gviz/tq?tqx=out:csv&sheet=<TabName>"
"""
import csv, json, re, sys

DIR = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)

def rows(name):
    with open(f"{DIR}/{name}") as f:
        return [r for r in csv.reader(f)]

def num(s):
    s = s.strip()
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None

FIX = {
    "Glinstone Comet Shard": "Glintstone Comet Shard",
    "Lighting Spear": "Lightning Spear",
    "Ironeeye": "Ironeye",
}
def fix(name):
    return FIX.get(name, name)

# ---------- Standard ----------
def parse_standard():
    out = []
    cur = None
    for r in rows("Standard.csv"):
        if len(r) < 7:
            continue
        name, base, p1, t1, p2, t2 = r[1], r[2], r[3], r[4], r[5], r[6]
        if not name.strip():
            continue
        # first row: header note ending in ". Dagger"
        m = re.search(r"outline\.\s*(\w+)$", name)
        if m:
            cur = {"weapon": m.group(1), "base": None, "attacks": []}
            out.append(cur)
            continue
        if not base.strip() and not p1.strip() and not t1.strip() and not p2.strip() and not t2.strip():
            cur = {"weapon": fix(name.strip()), "base": None, "attacks": []}
            out.append(cur)
            continue
        if cur is None:
            continue
        b = num(base)
        if b is not None and cur["base"] is None:
            cur["base"] = b
        atk_name = fix(name.strip())
        o, t = num(t1), num(t2)
        prev = cur["attacks"][-1] if cur["attacks"] else None
        if atk_name.startswith("- ") and prev:
            # follow-up hit of the previous attack: fold it in
            prev["hits"] += 1
            if o is not None:
                prev["oneHand"] = (prev["oneHand"] or 0) + o
            if t is not None:
                prev["twoHand"] = (prev["twoHand"] or 0) + t
            continue
        if prev and prev["name"] == atk_name:
            prev["hits"] += 1
            if o is not None:
                prev["oneHand"] = (prev["oneHand"] or 0) + o
            if t is not None:
                prev["twoHand"] = (prev["twoHand"] or 0) + t
        else:
            cur["attacks"].append({"name": atk_name, "hits": 1, "oneHand": o, "twoHand": t})
    return out

# ---------- Powerstance ----------
def parse_powerstance():
    out = []
    cur = None
    for r in rows("Powerstance.csv"):
        if len(r) < 6:
            continue
        name, base, pct, each, total = r[1], r[2], r[3], r[4], r[5]
        if not name.strip():
            continue
        m = re.search(r"outline\.\s*(\w+)$", name)
        if m:
            cur = {"weapon": m.group(1), "base": None, "attacks": []}
            out.append(cur)
            continue
        if not base.strip() and not pct.strip() and not each.strip() and not total.strip():
            cur = {"weapon": fix(name.strip()), "base": None, "attacks": []}
            out.append(cur)
            continue
        if cur is None:
            continue
        b = num(base)
        if b is not None and cur["base"] is None:
            cur["base"] = b
        atk_name = fix(name.strip())
        e = num(each)
        prev = cur["attacks"][-1] if cur["attacks"] else None
        if atk_name.startswith("- ") and prev:
            prev["hits"] += 1
            if e is not None:
                prev["total"] = (prev["total"] or 0) + e
            continue
        if prev and prev["name"] == atk_name:
            prev["hits"] += 1
            if e is not None:
                prev["total"] = (prev["total"] or 0) + e
        else:
            cur["attacks"].append({"name": atk_name, "hits": 1, "total": e})
    return out

# ---------- Spells ----------
def parse_spells():
    out = []
    category = "sorcery"
    for i, r in enumerate(rows("Spells.csv")):
        if i == 0:
            # header row embeds first spell? no — header row is pure header here
            m = re.search(r"testing\. Name$", r[1])
            if m:
                continue
        if len(r) < 8:
            continue
        name, variant, base, mod, hits, expected, average = r[1], r[2], r[3], r[4], r[5], r[6], r[7]
        if not name.strip():
            continue
        raw = name
        name = fix(name.strip())
        if name == "Catch Flame":
            category = "incantation"
        total = num(average)
        if total is None:
            total = num(expected)
        entry = {
            "name": name,
            "variant": variant.strip() or None,
            "hits": num(hits),
            "total": total,
            "expected": num(expected),
            "category": category,
        }
        if raw.startswith(" - "):
            # sub-row: attach to previous main spell as a note. If the parent's
            # measured total exceeds its per-cast expected value, the sub-hit is
            # already counted in the total; otherwise it's on top.
            if out:
                parent = out[-1]
                label = name.lstrip("- ").strip().lower()
                val = num(expected)
                included = (
                    parent["total"] is not None
                    and parent["expected"] is not None
                    and parent["total"] > parent["expected"]
                )
                note = (
                    f"includes {label} ({val})" if included else f"+ {label} ({val})"
                )
                parent["subNotes"] = parent.get("subNotes", []) + [note]
            continue
        out.append(entry)
    # second unlabeled Loretta's Mastery row is the charged cast
    seen = {}
    for s in out:
        key = (s["name"], s["variant"])
        if key in seen and s["variant"] is None:
            s["variant"] = "Charged"
        seen[key] = True
    return out

# ---------- Character skills ----------
def parse_skills():
    out = []
    character = None
    for r in rows("Character_Skills.csv"):
        if len(r) < 4:
            continue
        char, skill, total = r[1], r[2], r[3]
        if char.strip():
            character = fix(char.strip())
        if not skill.strip():
            continue
        sub = skill.startswith("  ") or skill.strip().startswith("-")
        out.append({
            "character": character,
            "skill": fix(skill.strip().lstrip("- ").strip()),
            "total": num(total),
            "sub": sub,
        })
    return out

def ts(v, indent=0):
    return json.dumps(v, ensure_ascii=False)

standard = parse_standard()
powerstance = parse_powerstance()
spells = parse_spells()
skills = parse_skills()

print(f"standard: {len(standard)} weapons, {sum(len(w['attacks']) for w in standard)} attacks", file=sys.stderr)
print(f"powerstance: {len(powerstance)} weapons", file=sys.stderr)
print(f"spells: {len(spells)}", file=sys.stderr)
print(f"skills: {len(skills)}", file=sys.stderr)
for w in standard:
    print("  S:", w["weapon"], w["base"], len(w["attacks"]), file=sys.stderr)
for w in powerstance:
    print("  P:", w["weapon"], w["base"], len(w["attacks"]), file=sys.stderr)

def emit_list(items, fmt):
    return ",\n".join(fmt(i) for i in items)

def spell_line(s):
    parts = [f"name: {ts(s['name'])}"]
    if s["variant"]:
        parts.append(f"variant: {ts(s['variant'])}")
    parts.append(f"hits: {ts(s['hits'])}")
    parts.append(f"total: {ts(s['total'])}")
    parts.append(f"category: {ts(s['category'])}")
    if s.get("subNotes"):
        parts.append(f"notes: {ts('; '.join(s['subNotes']))}")
    return "  { " + ", ".join(parts) + " }"

def atk_line(a):
    return "      { " + f"name: {ts(a['name'])}, hits: {a['hits']}, oneHand: {ts(a['oneHand'])}, twoHand: {ts(a['twoHand'])}" + " }"

def ps_line(a):
    return "      { " + f"name: {ts(a['name'])}, hits: {a['hits']}, total: {ts(a['total'])}" + " }"

def weapon_block(w, line_fn):
    attacks = ",\n".join(line_fn(a) for a in w["attacks"])
    return (
        "  {\n"
        f"    weapon: {ts(w['weapon'])},\n"
        f"    base: {ts(w['base'])},\n"
        "    attacks: [\n" + attacks + ",\n    ],\n  }"
    )

def skill_line(s):
    parts = [f"character: {ts(s['character'])}", f"skill: {ts(s['skill'])}", f"total: {ts(s['total'])}"]
    if s["sub"]:
        parts.append("sub: true")
    return "  { " + ", ".join(parts) + " }"

out = f"""// Revive damage ("helping a felled teammate up") reference. Generated from the
// community revive-damage spreadsheet (r/Nightreign):
// https://docs.google.com/spreadsheets/d/1w1qkrqrbp3uQ7d4MyYv4CYAWhKfanQnhI2hLf1Fkn6k/
// Regenerate with the parser script rather than hand-editing rows.

/** Near-death gauge per number of times felled this night. */
export type ReviveBar = {{
  timesFelled: number;
  bars: number;
  hpPerBar: number;
  totalHp: number;
  refillPerSecond: number;
}};

export const reviveBars: ReviveBar[] = [
  {{ timesFelled: 1, bars: 1, hpPerBar: 40, totalHp: 40, refillPerSecond: 2 }},
  {{ timesFelled: 2, bars: 2, hpPerBar: 45, totalHp: 90, refillPerSecond: 9 }},
  {{ timesFelled: 3, bars: 3, hpPerBar: 80, totalHp: 240, refillPerSecond: 40 }},
];

/** Base revive value shared by every weapon of a class. */
export type BaseReviveGroup = {{ base: number; classes: string[] }};

export const baseReviveValues: BaseReviveGroup[] = [
  {{ base: 10, classes: ["Claws", "Daggers", "Fists", "Torches"] }},
  {{ base: 12, classes: ["Bows", "Crossbows"] }},
  {{
    base: 14,
    classes: [
      "Axes", "Curved Swords", "Flails", "Hammers", "Katanas", "Medium Shields",
      "Small Shields", "Spears", "Straight Swords", "Thrusting Swords",
      "Twinblades", "Whips",
    ],
  }},
  {{
    base: 20,
    classes: [
      "Colossal Swords", "Curved Greatswords", "Greataxes", "Greatbows",
      "Greatshields", "Great Hammers", "Great Spears", "Halberds", "Reapers",
      "Revenant's Cursed Claws",
    ],
  }},
  {{ base: 25, classes: ["Colossal Weapons", "Ballistas"] }},
];

/**
 * One-/two-handed moveset. Multi-hit attacks are merged: `hits` is the number
 * of hits and the totals are the sum across all of them.
 */
export type StandardAttack = {{
  name: string;
  hits: number;
  oneHand: number | null;
  twoHand: number | null;
}};
export type StandardMoveset = {{ weapon: string; base: number | null; attacks: StandardAttack[] }};

export const standardMovesets: StandardMoveset[] = [
{emit_list(standard, lambda w: weapon_block(w, atk_line))},
];

/** Powerstance (L1) moveset; `total` sums every hit of the attack. */
export type PowerstanceAttack = {{ name: string; hits: number; total: number | null }};
export type PowerstanceMoveset = {{ weapon: string; base: number | null; attacks: PowerstanceAttack[] }};

export const powerstanceMovesets: PowerstanceMoveset[] = [
{emit_list(powerstance, lambda w: weapon_block(w, ps_line))},
];

/**
 * Revive damage per full cast. `total` is the measured full-cast value (null
 * where testing couldn't pin a number down); `hits` is projectile count where
 * known. `notes` carries extra components (splashes, explosions) — included in
 * the total only where noted on the sheet.
 */
export type ReviveSpell = {{
  name: string;
  variant?: string;
  hits: number | null;
  total: number | null;
  category: "sorcery" | "incantation";
  notes?: string;
}};

export const reviveSpells: ReviveSpell[] = [
{emit_list(spells, spell_line)},
];

/** Character skills / ultimates that deal revive damage. */
export type CharacterSkillRevive = {{
  character: string;
  skill: string;
  total: number | null;
  sub?: boolean;
}};

export const characterSkillRevives: CharacterSkillRevive[] = [
{emit_list(skills, skill_line)},
];

export const REVIVE_CREDIT =
  "Values measured by the r/Nightreign community's revive-damage spreadsheet.";

export const REVIVE_SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/1w1qkrqrbp3uQ7d4MyYv4CYAWhKfanQnhI2hLf1Fkn6k/";
"""

with open("src/data/revive.ts", "w") as f:
    f.write(out)
print("written", file=sys.stderr)
