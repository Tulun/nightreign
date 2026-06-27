#!/usr/bin/env python3
"""Merge the two shop datasets into the source-of-truth src/data/sets.ts.

Inputs (this folder):
  old.json  — previous app data: {id: {special:[{name,passive,rarity}], normal:[...]}}
  new.json  — community spreadsheet data, keyed by the SAME (old) set id:
              {id: {special:{weapons,tears,aromatics}, normal:{...}}}

Each merged weapon is its NORMAL form; a `deep` override carries the
Deep-of-Night changes (curse, changed passive, or a fully swapped item).

Merge rules:
  1. New non-cursed item  -> use it as-is (the spreadsheet is the correct/updated source).
  2. New cursed item, same name in old -> normal keeps the OLD passive; `deep`
     carries the new passives + curse.
  3. New cursed Purple in the NORMAL merchant with no old name-match -> it's a
     swap: normal = the old Purple (Scepter etc.); `deep` = the new item.
  4. Otherwise a cursed item keeps the new passive in normal; `deep` adds the curse.

Run:  python3 src/data/shop/merge.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
old = json.load(open(os.path.join(HERE, "old.json")))
new = json.load(open(os.path.join(HERE, "new.json")))

# Spreadsheet name typos → canonical names (from weapons.ts / shields.ts).
TYPO = {
    "Halo Slop": "Halo Scythe", "Cipher pata": "Cipher Pata", "Sword of ST. Trina": "Sword of St. Trina",
    "Anspur Rapier": "Antspur Rapier", "Azur's Glinstone Staff": "Azur's Glintstone Staff",
    "Azur's Glinstone staff": "Azur's Glintstone Staff", "Banished Knight Greatsword": "Banished Knight's Greatsword",
    "Beastman Curved Sword": "Beastman's Curved Sword", "Blodstained Dagger": "Bloodstained Dagger",
    "Carian Glinstone Staff": "Carian Glintstone Staff", "Claymen's Arpoon": "Clayman's Harpoon",
    "Commander Standard": "Commander's Standard", "Crepus Black-Key Crossbow": "Crepus's Black-Key Crossbow",
    "Cristal Knife": "Crystal Knife", "Distingiushed Greatshield": "Distinguished Greatshield",
    "Dragon halberd": "Dragon Halberd", "Eerdtree Bow": "Erdtree Bow", "Eerdtree Seal": "Erdtree Seal",
    "Erdstreel Dagger": "Erdsteel Dagger", "Erdtree's Greatbow": "Erdtree Greatbow",
    "Fingerprint Shield": "Fingerprint Stone Shield", "Flameberge": "Flamberge",
    "Gargoyle's Black halberd": "Gargoyle's Black Halberd", "Gelmir Glinstone Staff": "Gelmir Glintstone Staff",
    "Gelmir Staff": "Gelmir Glintstone Staff", "Gelmir's Staff": "Gelmir Glintstone Staff",
    "Giant Crusher": "Giant-Crusher", "Glinstione Kris": "Glintstone Kris", "Glinstone kris": "Glintstone Kris",
    "Godslayer Seal": "Godslayer's Seal", "Godslayer seal": "Godslayer's Seal",
    "Golden Order seal": "Golden Order Seal", "Golem's Greatbow": "Golem Greatbow",
    "Gravelstone Seal": "Gravel Stone Seal", "Great épée": "Great Epee",
    "Haligtree Crest Shield": "Haligtree Crest Greatshield", "Lazuli Glinstone Sword": "Lazuli Glintstone Sword",
    "Lordsworn Straight Sword": "Lordsworn's Straight Sword", "Lusat's Glinstone Staff": "Lusat's Glintstone Staff",
    "Miséricorde": "Misericorde", "Monk Flamemace": "Monk's Flamemace", "Night Raider's Glaive": "Nightrider Glaive",
    "Nightrider's Glaive": "Nightrider Glaive", "Nightriider's Glaive": "Nightrider Glaive",
    "Prince of Death Staff": "Prince of Death's Staff", "Scepter of the All Knowing": "Scepter of the All-Knowing",
    "Serpent God's Curved Sword": "Serpent-God's Curved Sword", "Shamrir": "Shamshir",
    "Staff of Lost": "Staff of Loss", "Staff of The Guilty": "Staff of the Guilty", "Star Fists": "Star Fist",
    "Twinblade Kite Shield": "Twinbird Kite Shield", "Warhawk Talon": "Warhawk's Talon",
    "Weathered Straigh Sword": "Weathered Straight Sword", "twinblade": "Twinblade",
}
def fix(n):
    return TYPO.get(n, n)

# Apply canonical names everywhere (old + new) so display and matching align.
for d in old.values():
    for m in ("special", "normal"):
        for e in d[m]:
            e["name"] = fix(e["name"])
# Unambiguous spelling fixes for skill / passive / curse text.
SPELL = [("Glinstone", "Glintstone"), ("Eerdtree", "Erdtree"), ("Ligtning", "Lightning")]
def spell(s):
    for a, b in SPELL:
        s = s.replace(a, b)
    return s
for d in new.values():
    for m in ("special", "normal"):
        for w in d[m]["weapons"]:
            w["name"] = fix(w["name"])
            w["skill"] = spell(w["skill"])
            w["affinity"] = spell(w["affinity"])
            w["passives"] = [spell(p) for p in w["passives"]]
            if w.get("curse"):
                w["curse"] = spell(w["curse"])

def merge_normal(old_list, new_m):
    # The Normal merchant lists line up position-for-position with the old data,
    # so each new item is aligned to its original by index. Two modes, NOT a 1:1
    # match — Deep of Night reworked the shop:
    #   - Non-cursed new item → the accurate current version (e.g. Morning Star
    #     became Star Fist). Used in both modes.
    #   - Cursed Purple whose name changed → a genuine DoN swap: normal shows the
    #     original Purple; Deep of Night swaps in the new cursed weapon.
    #   - Any other cursed item (same name, or a renamed Blue like Spiked Club →
    #     Star Fist) → normal keeps the NEW identity (name/affinity/skill) but the
    #     ORIGINAL passive; Deep of Night adds the new passives + curse.
    out = []
    for i, w in enumerate(new_m["weapons"]):
        om = old_list[i] if i < len(old_list) else None
        base = {k: w[k] for k in ("name", "rarity", "price", "affinity", "skill")}
        base["passives"] = list(w["passives"])
        if w.get("curse"):
            deep = {"passives": list(w["passives"]), "curse": w["curse"]}
            if w["rarity"] == "Purple" and om and om["name"] != w["name"]:
                base = {"name": om["name"], "rarity": "Purple", "price": 0,
                        "affinity": "", "skill": "",
                        "passives": [om["passive"]] if om["passive"] else []}
                deep = {k: w[k] for k in ("name", "rarity", "price", "affinity", "skill")}
                deep["passives"] = list(w["passives"]); deep["curse"] = w["curse"]
                base["deep"] = deep
            elif om:
                base["passives"] = [om["passive"]] if om["passive"] else []
                base["deep"] = deep
            else:
                base["deepOnly"] = True
                base["deep"] = {"curse": w["curse"]}
        out.append(base)
    return {"tears": new_m["tears"], "aromatics": new_m["aromatics"], "weapons": out}

def merge_special(old_list, new_m):
    # The Super merchant gained/lost items, so it can't align by position —
    # match by name instead. Same item originally → normal keeps its old rarity
    # + passive (e.g. Butchering Knife is Purple in normal, Red in DoN). A cursed
    # Purple with no match swaps in the next original Purple; anything else with
    # no original is a Deep-of-Night exclusive (hidden in normal).
    by_name = {e["name"]: e for e in old_list}
    used = set()
    old_purples = [e for e in old_list if e["rarity"] == "Purple"]
    out = []
    for w in new_m["weapons"]:
        base = {k: w[k] for k in ("name", "rarity", "price", "affinity", "skill")}
        base["passives"] = list(w["passives"])
        if w.get("curse"):
            deep = {"passives": list(w["passives"]), "curse": w["curse"]}
            om = by_name.get(w["name"])
            if om:
                base["rarity"] = om["rarity"]
                base["passives"] = [om["passive"]] if om["passive"] else []
                if w["rarity"] != om["rarity"]:
                    deep["rarity"] = w["rarity"]
                used.add(w["name"])
                base["deep"] = deep
            else:
                op = next((p for p in old_purples if p["name"] not in used), None)
                if w["rarity"] == "Purple" and op:
                    used.add(op["name"])
                    base = {"name": op["name"], "rarity": "Purple", "price": 0,
                            "affinity": "", "skill": "",
                            "passives": [op["passive"]] if op["passive"] else []}
                    deep = {k: w[k] for k in ("name", "rarity", "price", "affinity", "skill")}
                    deep["passives"] = list(w["passives"]); deep["curse"] = w["curse"]
                    base["deep"] = deep
                else:
                    base["deepOnly"] = True
                    base["deep"] = {"curse": w["curse"]}
        out.append(base)
    return {"tears": new_m["tears"], "aromatics": new_m["aromatics"], "weapons": out}

def js(v):
    return json.dumps(v, ensure_ascii=False)

def wjs(w):
    p = [f'name: {js(w["name"])}', f'rarity: {js(w["rarity"])}', f'price: {w["price"]}',
         f'affinity: {js(w["affinity"])}', f'skill: {js(w["skill"])}', f'passives: {js(w["passives"])}']
    if w.get("deepOnly"):
        p.append("deepOnly: true")
    if "deep" in w:
        d = w["deep"]
        dp = [f'{k}: {v if isinstance(v, int) else js(v)}' for k, v in d.items()]
        p.append("deep: { " + ", ".join(dp) + " }")
    return "{ " + ", ".join(p) + " }"

def mjs(m):
    ws = "\n".join(f"      {wjs(w)}," for w in m["weapons"])
    return "{\n      tears: " + js(m["tears"]) + ",\n      aromatics: " + js(m["aromatics"]) + ",\n      weapons: [\n" + ws + "\n      ],\n    }"

ids = sorted(new, key=int)
lines = ['import type { MerchantSet } from "@/lib/types";\n',
         "/** MERGED shop data (source of truth) — generated by src/data/shop/merge.py",
         " *  from new.json (old.json sets the seed order). Each weapon is its NORMAL",
         " *  form; `deep` holds the Deep-of-Night override. Items that are only ever",
         " *  cursed are `deepOnly` (hidden in the normal shop). */",
         'export const SHOP_CREDIT = "Shop data: community sheets, normal + Deep of Night";\n',
         "export const sets: MerchantSet[] = ["]
for oid in ids:
    m = {"special": merge_special(old[oid]["special"], new[oid]["special"]),
         "normal": merge_normal(old[oid]["normal"], new[oid]["normal"])}
    lines.append(f"  {{\n    id: {oid},\n    special: {mjs(m['special'])},\n    normal: {mjs(m['normal'])},\n  }},")
lines += ["];\n", "export function getSet(id: number): MerchantSet | undefined {",
          "  return sets.find((s) => s.id === id);", "}"]
open(os.path.join(HERE, "..", "sets.ts"), "w").write("\n".join(lines) + "\n")
print("wrote src/data/sets.ts from old.json + new.json")
