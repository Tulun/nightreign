// ─────────────────────────────────────────────────────────────────────────
//  Advanced filtering, shared by the relic pool and the build list.
//
//  A query is three clauses over tags and three over effect text — every
//  one of these, any one of these, none of these — plus the free-text box
//  that was there before. Everything is ANDed together: a query is what
//  survives all of its clauses, so adding a clause can only narrow.
// ─────────────────────────────────────────────────────────────────────────

export interface FilterQuery {
  /** Free text — matches a name, an effect line, or a tag. */
  text: string;
  /** Tags the subject must carry all of / at least one of / none of. */
  tagsAll: string[];
  tagsAny: string[];
  tagsNone: string[];
  /**
   * Effect-line searches, matched as case-insensitive substrings so "poison"
   * finds every poison line without anyone typing the full effect name.
   */
  effectsAll: string[];
  effectsAny: string[];
  effectsNone: string[];
}

/** What a query is run against — a relic, or a build and everything it slots. */
export interface FilterSubject {
  /** Names and the like: free text only, never the effect clauses. */
  labels: string[];
  /** Effect and demerit lines. */
  effects: string[];
  tags: string[];
}

export const EMPTY_QUERY: FilterQuery = {
  text: "",
  tagsAll: [],
  tagsAny: [],
  tagsNone: [],
  effectsAll: [],
  effectsAny: [],
  effectsNone: [],
};

/** Every clause of a query, in the order the panel lists them. */
export const QUERY_CLAUSES = [
  { key: "tagsAll", field: "tags", label: "Has all tags", short: "all of" },
  { key: "tagsAny", field: "tags", label: "Has any tag", short: "any of" },
  { key: "tagsNone", field: "tags", label: "Excludes tags", short: "none of" },
  { key: "effectsAll", field: "effects", label: "Has all effects", short: "all of" },
  { key: "effectsAny", field: "effects", label: "Has any effect", short: "any of" },
  { key: "effectsNone", field: "effects", label: "Excludes effects", short: "none of" },
] as const satisfies readonly {
  key: Exclude<keyof FilterQuery, "text">;
  field: "tags" | "effects";
  label: string;
  short: string;
}[];

export type ClauseKey = (typeof QUERY_CLAUSES)[number]["key"];

/** How many clauses (counting the text box) the query is actually narrowing by. */
export function activeClauseCount(q: FilterQuery): number {
  return (
    (q.text.trim() ? 1 : 0) + QUERY_CLAUSES.filter((c) => q[c.key].length > 0).length
  );
}

export const isEmptyQuery = (q: FilterQuery) => activeClauseCount(q) === 0;

const lower = (xs: string[]) => xs.map((x) => x.trim().toLowerCase()).filter(Boolean);

/** Whether any of `haystack` contains `needle` (both already lowercased). */
const hits = (haystack: string[], needle: string) => haystack.some((h) => h.includes(needle));

/**
 * Whether a subject survives the query. Tags match whole and exactly (case
 * aside) — they're picked from a registry, not typed — while effect terms
 * match as substrings of any line.
 */
export function matchesQuery(q: FilterQuery, subject: FilterSubject): boolean {
  const tags = lower(subject.tags);
  const effects = lower(subject.effects);
  const searchable = [...lower(subject.labels), ...effects, ...tags];

  const text = q.text.trim().toLowerCase();
  if (text && !hits(searchable, text)) return false;

  const all = lower(q.tagsAll);
  if (all.length && !all.every((t) => tags.includes(t))) return false;
  const any = lower(q.tagsAny);
  if (any.length && !any.some((t) => tags.includes(t))) return false;
  const none = lower(q.tagsNone);
  if (none.length && none.some((t) => tags.includes(t))) return false;

  const eAll = lower(q.effectsAll);
  if (eAll.length && !eAll.every((e) => hits(effects, e))) return false;
  const eAny = lower(q.effectsAny);
  if (eAny.length && !eAny.some((e) => hits(effects, e))) return false;
  const eNone = lower(q.effectsNone);
  if (eNone.length && eNone.some((e) => hits(effects, e))) return false;

  return true;
}

/**
 * The query in words — "tagged all of Boss, Solo · without effect Poison" —
 * so a filtered list always says why it's short, and an AND/OR/NOT query
 * doesn't have to be read back off the controls that built it.
 */
export function describeQuery(q: FilterQuery): string[] {
  const parts: string[] = [];
  const join = (xs: string[], sep: string) => xs.join(sep);
  if (q.tagsAll.length) parts.push(`tagged ${join(q.tagsAll, " and ")}`);
  if (q.tagsAny.length) parts.push(`tagged ${join(q.tagsAny, " or ")}`);
  if (q.tagsNone.length) parts.push(`not tagged ${join(q.tagsNone, " or ")}`);
  if (q.effectsAll.length) parts.push(`with ${join(q.effectsAll, " and ")}`);
  if (q.effectsAny.length) parts.push(`with ${join(q.effectsAny, " or ")}`);
  if (q.effectsNone.length) parts.push(`without ${join(q.effectsNone, " or ")}`);
  if (q.text.trim()) parts.push(`matching “${q.text.trim()}”`);
  return parts;
}

/**
 * Drop tags the registry no longer has (renamed, deleted) from a query, so a
 * filter can't quietly go on excluding a tag that doesn't exist. Returns the
 * same object when nothing changed — safe to call from an effect.
 */
export function withKnownTags(q: FilterQuery, registry: string[]): FilterQuery {
  const known = new Set(registry);
  const keys = ["tagsAll", "tagsAny", "tagsNone"] as const;
  if (keys.every((k) => q[k].every((t) => known.has(t)))) return q;
  const next = { ...q };
  for (const k of keys) next[k] = q[k].filter((t) => known.has(t));
  return next;
}
