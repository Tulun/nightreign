// ─────────────────────────────────────────────────────────────────────────
//  Magic spells — sorceries and incantations, grouped by school. In Nightreign
//  spells carry no stat requirements; the useful per-spell info is its school,
//  FP cost, damage type, and effect. Data from the Fextralife Magic Spells page
//  and each spell's individual page.
// ─────────────────────────────────────────────────────────────────────────

export type SpellCategory = "sorcery" | "incantation";

export interface Spell {
  name: string;
  /** School name, e.g. "Glintstone Sorceries". */
  school: string;
  category: SpellCategory;
  /** FP cost text, e.g. "12" or "12 (20)". */
  fp?: string | null;
  /** Damage type(s), e.g. "Magic". */
  damage?: string | null;
  /** Short effect description. */
  effect?: string | null;
  /** Local icon under /public, e.g. "/icons/spells/magic-glintblade.png". */
  icon?: string | null;
  /** Fextralife page path for the full entry, e.g. "/Magic+Glintblade". */
  href: string;
}

export interface SpellSchool {
  name: string;
  category: SpellCategory;
  spells: Spell[];
}

export const SPELL_CATEGORIES: { key: SpellCategory; label: string }[] = [
  { key: "sorcery", label: "Sorceries" },
  { key: "incantation", label: "Incantations" },
];

export const SPELL_WIKI_BASE = "https://eldenringnightreign.wiki.fextralife.com";
export const SPELL_CREDIT = "Spell data from eldenringnightreign.wiki.fextralife.com";

/** Group a flat spell list into ordered schools (first-seen school order). */
export function groupBySchool(spells: Spell[]): SpellSchool[] {
  const order: string[] = [];
  const map = new Map<string, SpellSchool>();
  for (const s of spells) {
    let school = map.get(s.school);
    if (!school) {
      school = { name: s.school, category: s.category, spells: [] };
      map.set(s.school, school);
      order.push(s.school);
    }
    school.spells.push(s);
  }
  return order.map((n) => map.get(n)!);
}
