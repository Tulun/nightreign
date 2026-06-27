import type { MerchantSet, ShopWeapon } from "@/lib/types";
import { sets } from "@/data/sets";

// ─────────────────────────────────────────────────────────────────────────
//  Town Map (seed shop) filtering + search.
//
//  Two filter groups, each in its own dropdown:
//    - "weapon"  → a specific staff/seal by name (every seed carries some).
//    - "passive" → a weapon passive (matched on the passive name, ignoring its
//                  inline value like "(+18%)"). Matches across both merchants.
//
//  Filters use ANY (OR) semantics; the free-text search then narrows further.
// ─────────────────────────────────────────────────────────────────────────

export type FilterKind = "weapon" | "passive";
export type WeaponSource = "special" | "normal" | "both";

export interface FilterOption {
  key: string;
  label: string;
  kind: FilterKind;
  source?: WeaponSource;
  dividerBefore?: boolean;
}

export interface FilterGroups {
  weapons: FilterOption[];
  passives: FilterOption[];
}

const NOT_A_STAFF = new Set(["Staff of the Avatar"]);
const isStaff = (name: string) => name.toLowerCase().includes("staff") && !NOT_A_STAFF.has(name);
const isSeal = (name: string) => name.toLowerCase().includes("seal");

const allWeapons = (set: MerchantSet): ShopWeapon[] => [...set.special.weapons, ...set.normal.weapons];

/** Passive label without its trailing inline value, e.g. "Improved Skill Attack Power". */
const passiveName = (p: string) => p.replace(/\s*\([^)]*\)\s*$/, "").trim();
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const byLabel = (a: string, b: string) => a.localeCompare(b);

function sourceOf(name: string, special: Set<string>, normal: Set<string>): WeaponSource {
  const s = special.has(name);
  const n = normal.has(name);
  return s && n ? "both" : s ? "special" : "normal";
}

export function buildFilterOptions(): FilterGroups {
  const staffSpecial = new Set<string>();
  const staffNormal = new Set<string>();
  const sealSpecial = new Set<string>();
  const sealNormal = new Set<string>();
  const passives = new Map<string, string>(); // norm(name) → display name

  for (const set of sets) {
    for (const w of set.special.weapons) {
      if (isStaff(w.name)) staffSpecial.add(w.name);
      if (isSeal(w.name)) sealSpecial.add(w.name);
    }
    for (const w of set.normal.weapons) {
      if (isStaff(w.name)) staffNormal.add(w.name);
      if (isSeal(w.name)) sealNormal.add(w.name);
    }
    for (const w of allWeapons(set)) {
      for (const p of [...w.passives, ...(w.deep?.passives ?? [])]) {
        const name = passiveName(p);
        const key = norm(name);
        if (key && !passives.has(key)) passives.set(key, name);
      }
    }
  }

  const uniqStaves = Array.from(new Set(Array.from(staffSpecial).concat(Array.from(staffNormal)))).sort(byLabel);
  const uniqSeals = Array.from(new Set(Array.from(sealSpecial).concat(Array.from(sealNormal)))).sort(byLabel);

  const staffOptions: FilterOption[] = uniqStaves.map((name) => ({
    key: `weapon:${name}`,
    label: name,
    kind: "weapon",
    source: sourceOf(name, staffSpecial, staffNormal),
  }));
  const sealOptions: FilterOption[] = uniqSeals.map((name, i) => ({
    key: `weapon:${name}`,
    label: name,
    kind: "weapon",
    source: sourceOf(name, sealSpecial, sealNormal),
    dividerBefore: i === 0,
  }));

  const passiveOptions: FilterOption[] = Array.from(passives.values())
    .sort(byLabel)
    .map((p) => ({ key: `passive:${p}`, label: p, kind: "passive" as const }));

  return { weapons: [...staffOptions, ...sealOptions], passives: passiveOptions };
}

function setMatches(set: MerchantSet, opt: FilterOption): boolean {
  if (opt.kind === "weapon") {
    return allWeapons(set).some((w) => w.name === opt.label || w.deep?.name === opt.label);
  }
  const target = norm(opt.label);
  return allWeapons(set).some((w) =>
    [...w.passives, ...(w.deep?.passives ?? [])].some((p) => norm(passiveName(p)) === target),
  );
}

/** OR semantics: a set passes if it matches ANY selected filter. */
export function filterSets(
  setsList: MerchantSet[],
  selectedKeys: string[],
  options: FilterOption[],
): MerchantSet[] {
  if (selectedKeys.length === 0) return setsList;
  const selected = options.filter((o) => selectedKeys.includes(o.key));
  return setsList.filter((set) => selected.some((o) => setMatches(set, o)));
}

/** Free-text search across weapon name, passives, skill, affinity, and curse. */
export function searchSets(setsList: MerchantSet[], query: string): MerchantSet[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return setsList;
  return setsList.filter((set) =>
    allWeapons(set).some((w) =>
      [
        w.name, w.skill, w.affinity, ...w.passives,
        w.deep?.name ?? "", w.deep?.skill ?? "", w.deep?.curse ?? "", ...(w.deep?.passives ?? []),
      ].some((s) => s.toLowerCase().includes(needle)),
    ),
  );
}
