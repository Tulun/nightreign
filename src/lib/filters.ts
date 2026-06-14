import type { MerchantSet, WeaponEntry } from "@/lib/types";
import { sets } from "@/data/sets";

// ─────────────────────────────────────────────────────────────────────────
//  Town Map filtering + search.
//
//  Two independent filter groups, each in its own dropdown:
//    - "weapon"  → a specific staff/seal by name. Every set carries some staff
//                  and some seal, so the useful question is *which one*. An
//                  option matches a set if the weapon is in EITHER merchant,
//                  and carries a `source` badge for where it shows up overall.
//    - "passive" → a weapon passive. Matches across both merchants.
//
//  Filters use ANY (OR) semantics: a set passes if it satisfies at least one
//  selected filter. The free-text search (searchSets) then narrows that result
//  to sets selling an item whose name/passive contains the query.
// ─────────────────────────────────────────────────────────────────────────

export type FilterKind = "weapon" | "passive";

/** Where a staff/seal shows up across all sets. */
export type WeaponSource = "special" | "normal" | "both";

export interface FilterOption {
  /** Stable unique id used in selection state. */
  key: string;
  /** Display label. */
  label: string;
  kind: FilterKind;
  /** For weapon options: which merchant(s) carry it across all sets. */
  source?: WeaponSource;
  /** Render a group-separator divider above this option. */
  dividerBefore?: boolean;
}

export interface FilterGroups {
  /** Staves then seals, each alphabetical (one entry per unique name). */
  weapons: FilterOption[];
  /** Preferred passives first, then the rest alphabetical. */
  passives: FilterOption[];
}

/** Passives pinned to the top of the passive list, in this exact order. */
const PREFERRED_PASSIVES = [
  "Taking damage boosts damage negation",
  "Less likely to be targeted",
  "Improved damage negation at full HP",
  "Damage negation up upon landing charged attacks",
];

/**
 * Weapons whose name contains "staff"/"seal" but which are NOT a glintstone
 * staff or sacred seal. "Staff of the Avatar" is a colossal weapon.
 */
const NOT_A_STAFF = new Set(["Staff of the Avatar"]);

function isStaff(name: string): boolean {
  return name.toLowerCase().includes("staff") && !NOT_A_STAFF.has(name);
}
function isSeal(name: string): boolean {
  return name.toLowerCase().includes("seal");
}

function allEntries(set: MerchantSet): WeaponEntry[] {
  return [...set.specialMerchant, ...set.normalMerchant];
}

const byLabel = (a: string, b: string) => a.localeCompare(b);

function sourceOf(name: string, special: Set<string>, normal: Set<string>): WeaponSource {
  const s = special.has(name);
  const n = normal.has(name);
  return s && n ? "both" : s ? "special" : "normal";
}

/** Build the two ordered option groups from the data. */
export function buildFilterOptions(): FilterGroups {
  const staffSpecial = new Set<string>();
  const staffNormal = new Set<string>();
  const sealSpecial = new Set<string>();
  const sealNormal = new Set<string>();
  const passives = new Set<string>();

  for (const set of sets) {
    for (const e of set.specialMerchant) {
      if (isStaff(e.name)) staffSpecial.add(e.name);
      if (isSeal(e.name)) sealSpecial.add(e.name);
    }
    for (const e of set.normalMerchant) {
      if (isStaff(e.name)) staffNormal.add(e.name);
      if (isSeal(e.name)) sealNormal.add(e.name);
    }
    for (const e of allEntries(set)) passives.add(e.passive);
  }

  const staffNames = Array.from(staffSpecial).concat(Array.from(staffNormal));
  const sealNames = Array.from(sealSpecial).concat(Array.from(sealNormal));
  const uniqSortedStaves = Array.from(new Set(staffNames)).sort(byLabel);
  const uniqSortedSeals = Array.from(new Set(sealNames)).sort(byLabel);

  const staffOptions: FilterOption[] = uniqSortedStaves.map((name) => ({
    key: `weapon:${name}`,
    label: name,
    kind: "weapon",
    source: sourceOf(name, staffSpecial, staffNormal),
  }));
  const sealOptions: FilterOption[] = uniqSortedSeals.map((name, i) => ({
    key: `weapon:${name}`,
    label: name,
    kind: "weapon",
    source: sourceOf(name, sealSpecial, sealNormal),
    // Divider between the staff block and the seal block.
    dividerBefore: i === 0,
  }));

  const preferred = PREFERRED_PASSIVES.filter((p) => passives.has(p));
  const preferredSet = new Set(preferred);
  const rest = Array.from(passives).filter((p) => !preferredSet.has(p)).sort(byLabel);
  const passiveOptions: FilterOption[] = [
    ...preferred.map((p) => ({ key: `passive:${p}`, label: p, kind: "passive" as const })),
    ...rest.map((p, i) => ({
      key: `passive:${p}`,
      label: p,
      kind: "passive" as const,
      dividerBefore: i === 0,
    })),
  ];

  return { weapons: [...staffOptions, ...sealOptions], passives: passiveOptions };
}

/** Does a set satisfy a single filter? */
function setMatches(set: MerchantSet, opt: FilterOption): boolean {
  // Specific staff/seal — match by exact name in either merchant.
  if (opt.kind === "weapon") {
    return allEntries(set).some((e) => e.name === opt.label);
  }
  return allEntries(set).some((e) => e.passive === opt.label);
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

/**
 * Free-text search: a set matches if any item it sells (in EITHER merchant)
 * has a name or passive containing the query (case-insensitive). Covers weapon
 * names, a set's purple signature item, and passive effects. Empty → all.
 */
export function searchSets(setsList: MerchantSet[], query: string): MerchantSet[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return setsList;
  return setsList.filter((set) =>
    allEntries(set).some(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        e.passive.toLowerCase().includes(needle),
    ),
  );
}
