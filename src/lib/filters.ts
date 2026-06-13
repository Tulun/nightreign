import type { MerchantSet, WeaponEntry } from "@/lib/types";
import { sets } from "@/data/sets";

// ─────────────────────────────────────────────────────────────────────────
//  Set filtering for the Town Map grid.
//
//  Two kinds of filter, all shown in one multiselect:
//    - "name"    → matches sets that sell a weapon whose name contains a
//                  keyword (Staff, Seal).
//    - "passive" → matches sets that sell a weapon with that exact passive.
//
//  A set matches the active selection with ANY (OR) semantics: it shows if it
//  satisfies at least one selected filter. With nothing selected, all show.
// ─────────────────────────────────────────────────────────────────────────

export type FilterKind = "name" | "passive";

export interface FilterOption {
  /** Stable unique id used in selection state. */
  key: string;
  /** Display label. */
  label: string;
  kind: FilterKind;
  /** For "name" filters: the lowercase substring to look for in weapon names. */
  needle?: string;
  /** True for the options pinned to the top of the list (custom order). */
  pinned: boolean;
}

/** Weapon-name filters, pinned to the very top in this order. */
const NAME_FILTERS: Omit<FilterOption, "pinned">[] = [
  { key: "name:seal", label: "Seal", kind: "name", needle: "seal" },
  { key: "name:staff", label: "Staff", kind: "name", needle: "staff" },
];

/** Passives pinned directly under the name filters, in this exact order. */
const PREFERRED_PASSIVES = [
  "Taking damage boosts damage negation",
  "Less likely to be targeted",
  "Improved damage negation at full HP",
  "Damage negation up upon landing charged attacks",
];

function allEntries(set: MerchantSet): WeaponEntry[] {
  return [...set.specialMerchant, ...set.normalMerchant];
}

/**
 * Build the ordered list of filter options from the data:
 *   Seal, Staff, the four preferred passives, then every other passive A→Z.
 */
export function buildFilterOptions(): FilterOption[] {
  const passives = new Set<string>();
  for (const set of sets) {
    for (const entry of allEntries(set)) passives.add(entry.passive);
  }

  const preferred = PREFERRED_PASSIVES.filter((p) => passives.has(p));
  const preferredSet = new Set(preferred);
  const rest = Array.from(passives)
    .filter((p) => !preferredSet.has(p))
    .sort((a, b) => a.localeCompare(b));

  const nameOptions: FilterOption[] = NAME_FILTERS.map((o) => ({ ...o, pinned: true }));
  const preferredOptions: FilterOption[] = preferred.map((p) => ({
    key: `passive:${p}`,
    label: p,
    kind: "passive",
    pinned: true,
  }));
  const restOptions: FilterOption[] = rest.map((p) => ({
    key: `passive:${p}`,
    label: p,
    kind: "passive",
    pinned: false,
  }));

  return [...nameOptions, ...preferredOptions, ...restOptions];
}

/** Does a set satisfy a single filter? */
function setMatches(set: MerchantSet, opt: FilterOption): boolean {
  const entries = allEntries(set);
  if (opt.kind === "name") {
    return entries.some((e) => e.name.toLowerCase().includes(opt.needle!));
  }
  return entries.some((e) => e.passive === opt.label);
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
