// ─────────────────────────────────────────────────────────────────────────
//  User builds — stored in the signed-in account's Firestore copy, with a
//  per-account localStorage cache behind it (see cloudSync.ts /
//  useAccountStore.ts). A build is a
//  character + chalice + three relic slots (plus three Deep of Night slots);
//  each slot holds either a fixed relic from the app's data or a
//  user-created custom relic. A build can carry up to MAX_VARIANTS loadout
//  variants — takes on the same idea, each with its own chalice and slots,
//  all locked to the build's one character.
// ─────────────────────────────────────────────────────────────────────────

import { characterSwaps } from "@/data/statSwaps";
import { asset } from "@/lib/assets";
import { uniqueRelics, type UniqueRelicGroup } from "@/data/uniqueRelics";
import { NORMAL_EFFECT_VOCABULARY, isCurseEffect, resolveEffectAlias } from "@/lib/effectMatch";
import { gameEffectName } from "@/lib/relics";
import { SCENE_META, relicIcon, swapRelicEffects } from "@/lib/statSwaps";
import type { SlotColor } from "@/lib/chalices";

/** The in-game relic appearances a custom relic can wear. */
export const RELIC_LOOKS = [
  "delicate",
  "polished",
  "grand",
  "deep-delicate",
  "deep-polished",
  "deep-grand",
] as const;
export type RelicLook = (typeof RELIC_LOOKS)[number];

export interface CustomRelic {
  id: string;
  /** Optional display name; falls back to "<Color> relic". */
  name: string;
  color: Exclude<SlotColor, "White">;
  /** Icon appearance; unset relics get a stable pseudo-random default. */
  look?: RelicLook;
  /** Up to 3 effect lines. */
  effects: string[];
  /** Per-line demerits (Deep relics): demerits[i] belongs to effects[i]. */
  demerits: string[];
  /**
   * Deep of Night relic — only these fit deep slots (and only they carry
   * demerits). Normalized stores always have it set; relics from before the
   * flag get a one-time guess (see inferDeep), adjustable in My Relics.
   */
  deep?: boolean;
  /**
   * User keywords for filtering the pool, drawn from BuildStore.relicTags.
   * A separate registry from build tags — "Boss" as a build's purpose and
   * "Boss" as a relic's keyword are different vocabularies.
   */
  tags?: string[];
}

/**
 * Best guess at deep-ness for relics saved before the flag existed: a
 * demerit or a deep look proves Deep; anything else reads as normal (a
 * demerit-less deep relic can't be told apart — the user can fix it).
 */
export function inferDeep(r: Pick<CustomRelic, "demerits" | "look">): boolean {
  return (r.demerits ?? []).some((d) => d && d.trim()) || (r.look?.startsWith("deep-") ?? false);
}

/** Scene look per relic color (Drizzly=Blue, Tranquil=Green in-game). */
const SCENE_BY_COLOR: Record<CustomRelic["color"], string> = {
  Red: "burning",
  Blue: "drizzly",
  Green: "tranquil",
  Yellow: "luminous",
};

/** Icon path for a given color + look combination. */
export function relicLookIcon(color: CustomRelic["color"], look: RelicLook): string {
  return `/icons/relics/${look}-${SCENE_BY_COLOR[color]}-scene.png`;
}

/**
 * The look a relic renders with: its saved look if the user picked one,
 * otherwise sized by effect count the way the game does — 1 line renders as
 * the tiny delicate relic, 2 as polished, 3 as grand. Deep relics use the
 * deep variants.
 */
export function effectiveLook(relic: Pick<CustomRelic, "look" | "deep" | "effects">): RelicLook {
  if (relic.look) return relic.look;
  const lines = (relic.effects ?? []).filter((e) => e && e.trim()).length;
  const size = Math.min(Math.max(lines, 1), 3) - 1;
  return RELIC_LOOKS[size + (relic.deep ? 3 : 0)];
}

/** Icon path for a custom relic (its color's scene, in its look). */
export function customRelicIcon(relic: Pick<CustomRelic, "look" | "color" | "deep" | "effects">): string {
  return relicLookIcon(relic.color, effectiveLook(relic));
}

export type BuildSlot =
  | { kind: "fixed"; name: string }
  | { kind: "custom"; id: string }
  | null;

export type SlotTriple = [BuildSlot, BuildSlot, BuildSlot];

/** An extra loadout under the same build idea — see Build.variants. */
export interface BuildVariant {
  /** Tab label; "" falls back to a positional default ("Variant 2"…). */
  name: string;
  chalice: string;
  slots: SlotTriple;
  deepSlots: SlotTriple;
}

export interface Build {
  id: string;
  name: string;
  character: string;
  /** Chalice name from data/chalices (character vessels or grails). */
  chalice: string;
  slots: SlotTriple;
  /** Deep of Night slots — same chalice, its Deep layout. Often left empty. */
  deepSlots: SlotTriple;
  notes: string;
  /** User-defined tags for filtering, drawn from BuildStore.tags. */
  tags?: string[];
  /** Tab label for the build's own loadout when variants exist ("Main"). */
  variantName?: string;
  /**
   * Alternate loadouts: the build's own chalice/slots/deepSlots are the
   * first variant, these are the extras (capped at MAX_VARIANTS - 1). They
   * share the build's character — a different Nightfarer is a new build.
   */
  variants?: BuildVariant[];
  updatedAt: number;
  /**
   * Community-profile visibility: undefined/true = shown on your profile,
   * false = hidden. Nothing sets it to false yet — every build is public
   * until a private/public toggle ships.
   */
  public?: boolean;
  /**
   * Build-scoped custom relics. Never set on stored builds — the party
   * planner renders its member snapshots as transient Builds, and their
   * slots resolve against these instead of the viewer's pool.
   */
  relics?: CustomRelic[];
}

export interface BuildStore {
  version: 3;
  builds: Build[];
  customRelics: CustomRelic[];
  /** User-managed tag registry for organizing builds (kept sorted). */
  tags: string[];
  /**
   * The same, for relic keywords — a registry of its own so the two
   * vocabularies can't drag each other around (see CustomRelic.tags).
   */
  relicTags: string[];
  /**
   * Deletions, as key → time deleted (ms epoch). Every merge is a union, so
   * without these a build or relic deleted on one device is simply handed
   * back by the next device that still has it. Keys are build and relic ids,
   * and tagTombstone(name) / relicTagTombstone(name) for the two tag
   * registries. See applyTombstones for the rules.
   */
  deleted: Record<string, number>;
}

/** Tombstone key for a build tag — builds and relics are keyed by their own id. */
export const tagTombstone = (tag: string) => `tag:${tag.trim()}`;

/** Tombstone key for a relic keyword — its own namespace, its own registry. */
export const relicTagTombstone = (tag: string) => `relicTag:${tag.trim()}`;

/**
 * How long a deletion is remembered. Tombstones exist to outlive the other
 * device's copy of what they delete, not forever; a device that rejoins after
 * months away can resurrect what it holds, which beats growing the store
 * without bound for the lifetime of an account.
 */
const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Where the account's store used to live, for everyone, signed in or not.
 * Builds now belong to an account (the cloud copy is the source of truth), so
 * this key is only read once more: to offer its contents for import at the
 * first sign-in after the change. See loadLegacyStore.
 */
const LEGACY_STORAGE_KEY = "nightreign-builds";

/** Set once the legacy store above has been imported, or turned down. */
const LEGACY_DONE_KEY = "nightreign-builds-legacy-done";

/** Cache key for one account's store — per uid, so two accounts on one
 *  browser can't read each other's copy. */
const cacheKey = (uid: string) => `nightreign-builds:${uid}`;

export const EMPTY_STORE: BuildStore = {
  version: 3,
  builds: [],
  customRelics: [],
  tags: [],
  relicTags: [],
  deleted: {},
};

export const EMPTY_SLOTS: SlotTriple = [null, null, null];

// ── Loadout variants ─────────────────────────────────────────────────────

/** Loadouts per build, counting the build's own (kept small for the tab UI). */
export const MAX_VARIANTS = 4;

/** One loadout's worth of a build: what a variant tab shows and edits. */
export interface VariantView {
  chalice: string;
  slots: SlotTriple;
  deepSlots: SlotTriple;
}

export const variantCount = (b: Build): number => 1 + (b.variants?.length ?? 0);

/** Tab label for variant i — the stored name, or a positional default. */
export function variantLabel(b: Build, i: number): string {
  if (i === 0) return b.variantName?.trim() || "Main";
  return b.variants?.[i - 1]?.name.trim() || `Variant ${i + 1}`;
}

/** The chalice + slots behind variant i (0 = the build's own loadout). */
export function variantAt(b: Build, i: number): VariantView {
  const v = i > 0 ? b.variants?.[i - 1] : undefined;
  return v ?? { chalice: b.chalice, slots: b.slots, deepSlots: b.deepSlots };
}

/**
 * The variant index a `&v=` link asks for. Anything the build can't honour —
 * absent, not a whole number, or naming a variant since deleted or renumbered
 * — falls back to the build's own loadout, so a stale link still opens the
 * build on something rather than on nothing.
 */
export function variantIdxFromParam(v: string | null | undefined, b: Build): number {
  const i = Number(v);
  return v && Number.isInteger(i) && i > 0 && i < variantCount(b) ? i : 0;
}

/** Write a change to variant i's loadout back onto the build. */
export function withVariantPatch(b: Build, i: number, patch: Partial<VariantView>): Build {
  if (i === 0) return { ...b, ...patch };
  return {
    ...b,
    variants: (b.variants ?? []).map((v, j) => (j === i - 1 ? { ...v, ...patch } : v)),
  };
}

// ── Slot legality ────────────────────────────────────────────────────────

/**
 * The color of the relic sitting in a slot — null for an empty slot, and for
 * one whose relic has gone missing from the pool (a dangling id is nothing to
 * judge legality on, so callers leave it alone rather than clear it).
 */
export function slotRelicColor(
  slot: BuildSlot,
  store: Pick<BuildStore, "customRelics">,
): Exclude<SlotColor, "White"> | null {
  if (!slot) return null;
  if (slot.kind === "fixed") return fixedRelics.find((r) => r.name === slot.name)?.color ?? null;
  return store.customRelics.find((r) => r.id === slot.id)?.color ?? null;
}

/** Whether a relic can sit in a slot of this color — White takes anything. */
export function slotFits(
  slot: BuildSlot,
  slotColor: SlotColor,
  store: Pick<BuildStore, "customRelics">,
): boolean {
  if (slotColor === "White") return true;
  const color = slotRelicColor(slot, store);
  return color === null || color === slotColor;
}

/**
 * A loadout's slots re-checked against a chalice's colors: relics that still
 * fit stay put, the rest are emptied. Used when swapping chalices — the game
 * won't let a Red relic sit in a Blue socket, so carrying it across would show
 * a build that can't be equipped.
 */
export function slotsForColors(
  slots: SlotTriple,
  colors: readonly SlotColor[],
  store: Pick<BuildStore, "customRelics">,
): { slots: SlotTriple; cleared: number } {
  let cleared = 0;
  const next = slots.map((slot, i) => {
    if (slotFits(slot, colors[i] ?? "White", store)) return slot;
    cleared++;
    return null;
  }) as SlotTriple;
  return { slots: cleared > 0 ? next : slots, cleared };
}

/**
 * The fixed relics a loadout already has slotted. A fixed relic is a single
 * in-game item — one Glass Necklace, one Will of Balance, one of each stat
 * swap — so it can't sit in two of the same loadout's sockets at once, and the
 * picker greys the ones already in.
 *
 * `except` is the slot being filled, whose own relic mustn't count against
 * itself (swapping a relic for itself is a no-op, not a duplicate). Deep slots
 * never hold fixed relics, so only the normal three are ever asked about.
 */
export function slottedFixedNames(
  slots: readonly BuildSlot[],
  except?: number,
): Set<string> {
  const names = new Set<string>();
  slots.forEach((slot, i) => {
    if (i !== except && slot?.kind === "fixed") names.add(slot.name);
  });
  return names;
}

/** Rename variant i's tab. */
export function withVariantLabel(b: Build, i: number, name: string): Build {
  if (i === 0) return { ...b, variantName: name };
  return {
    ...b,
    variants: (b.variants ?? []).map((v, j) => (j === i - 1 ? { ...v, name } : v)),
  };
}

/** Keep only well-formed variants (stores from before them have none). */
function sanitizeVariants(v: unknown): BuildVariant[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const shaped = v.filter(
    (x): x is BuildVariant =>
      !!x &&
      typeof x === "object" &&
      typeof (x as BuildVariant).chalice === "string" &&
      Array.isArray((x as BuildVariant).slots) &&
      (x as BuildVariant).slots.length === 3,
  );
  const out = shaped.slice(0, MAX_VARIANTS - 1).map((x) => ({
    name: typeof x.name === "string" ? x.name : "",
    chalice: x.chalice,
    slots: x.slots,
    deepSlots:
      Array.isArray(x.deepSlots) && x.deepSlots.length === 3
        ? x.deepSlots
        : ([...EMPTY_SLOTS] as SlotTriple),
  }));
  return out.length > 0 ? out : undefined;
}

/**
 * Migrate a legacy relic whose effects were one flat list (with any curse
 * mixed in) into parallel effects + per-line demerits: a curse line becomes
 * the demerit of the effect above it.
 */
function migrateRelicLines(relic: CustomRelic): CustomRelic {
  if (Array.isArray(relic.demerits)) return relic;
  const effects: string[] = [];
  const demerits: string[] = [];
  for (const raw of (relic.effects ?? []).filter(Boolean)) {
    if (isCurseEffect(raw) && effects.length > 0) {
      demerits[effects.length - 1] = raw;
    } else {
      effects.push(raw);
      demerits.push("");
    }
  }
  return { ...relic, effects, demerits: effects.map((_, i) => demerits[i] ?? "") };
}

/**
 * Rewrite a relic's lines into the game's own spelling, so what's saved reads
 * like the relic in game ("Duchess: …" → "[Duchess] …", "… Scarlet Rot
 * Buildup" → "… Rot Buildup"). Applied on every load/import, so stores
 * written before these renames convert on their next save; text that isn't a
 * known effect passes through untouched.
 */
function gameRelicLines(relic: CustomRelic): CustomRelic {
  const line = (s: string) => resolveEffectAlias(gameEffectName(s));
  return {
    ...relic,
    effects: relic.effects.map(line),
    demerits: relic.demerits?.map(line),
  };
}

/** Record deletions of the given keys (ids, or tagTombstone(name)). */
export function withTombstones(store: BuildStore, keys: string[], at = Date.now()): BuildStore {
  const deleted = { ...store.deleted };
  for (const k of keys) deleted[k] = at;
  return applyTombstones({ ...store, deleted });
}

/**
 * Forget the deletion of these keys — creating a tag by a name that was
 * deleted before makes it a live tag again. Ids are never reused, so this is
 * only ever needed for tags.
 */
export function withoutTombstones(store: BuildStore, keys: string[]): BuildStore {
  const deleted = { ...store.deleted };
  for (const k of keys) delete deleted[k];
  return { ...store, deleted };
}

/** Newest deletion time per key across two stores. */
export function mergeTombstones(
  a: Record<string, number> | undefined,
  b: Record<string, number> | undefined,
): Record<string, number> {
  const out = { ...(a ?? {}) };
  for (const [k, at] of Object.entries(b ?? {})) {
    if (!(k in out) || at > out[k]) out[k] = at;
  }
  return out;
}

/**
 * Enforce the tombstones over a store's contents, and drop the ones that no
 * longer have anything to do:
 *
 *   • a build outlives its tombstone if it was edited after the delete (an
 *     edit on another device beats a stale delete, mirroring the updatedAt
 *     rule the merges already use) — and the beaten tombstone is dropped, so
 *     the delete can't come back and win a later round.
 *   • a relic carries no timestamp, so its tombstone always wins. An edit
 *     made on one device to a relic another device deleted is lost, the same
 *     trade the id-clash rule already makes.
 *   • a build tag is removed from the registry and from the builds that
 *     predate the delete; a build edited afterwards keeps it, and its tag
 *     goes back in the registry (the same "edit beats stale delete" rule).
 *   • a relic keyword is removed from the registry and from every relic
 *     carrying it — relics have no timestamp to weigh a delete against, so
 *     the tombstone always wins, as it does for a deleted relic.
 *   • tombstones past TOMBSTONE_TTL_MS expire.
 *
 * Every store passes through here — load, import, and both merges — so the
 * rules can't be applied in one path and forgotten in another.
 */
export function applyTombstones(store: BuildStore, now = Date.now()): BuildStore {
  const deleted: Record<string, number> = {};
  for (const [k, at] of Object.entries(store.deleted ?? {})) {
    if (now - at < TOMBSTONE_TTL_MS) deleted[k] = at;
  }
  const survives = (b: Build) => {
    const at = deleted[b.id];
    if (at === undefined) return true;
    if (b.updatedAt > at) {
      delete deleted[b.id]; // the edit won — stop re-fighting this delete
      return true;
    }
    return false;
  };
  const builds = store.builds.filter(survives).map((b) => {
    const kept = (b.tags ?? []).filter((t) => {
      const at = deleted[tagTombstone(t)];
      return at === undefined || b.updatedAt > at;
    });
    return kept.length === (b.tags?.length ?? 0) ? b : { ...b, tags: kept };
  });
  const customRelics = store.customRelics
    .filter((r) => deleted[r.id] === undefined)
    .map((r) => {
      const kept = (r.tags ?? []).filter((t) => deleted[relicTagTombstone(t)] === undefined);
      return kept.length === (r.tags?.length ?? 0) ? r : { ...r, tags: kept };
    });
  return {
    ...store,
    builds,
    customRelics,
    // A tag a surviving build still carries stays in the registry — same rule
    // normalizeStore uses to keep every tag in use declared.
    tags: sortedTags([
      ...store.tags.filter((t) => deleted[tagTombstone(t)] === undefined),
      ...builds.flatMap((b) => b.tags ?? []),
    ]),
    relicTags: sortedTags([
      ...(store.relicTags ?? []).filter((t) => deleted[relicTagTombstone(t)] === undefined),
      ...customRelics.flatMap((r) => r.tags ?? []),
    ]),
    deleted,
  };
}

/** Validate/migrate a parsed store of any known version; null if unusable. */
export function normalizeStore(data: unknown): BuildStore | null {
  const d = data as {
    version?: number;
    builds?: Build[];
    customRelics?: CustomRelic[];
    tags?: unknown[];
    relicTags?: unknown[];
    deleted?: Record<string, number>;
  };
  if (!d || !Array.isArray(d.builds) || !Array.isArray(d.customRelics)) return null;
  if (d.version !== 1 && d.version !== 2 && d.version !== 3) return null;
  // v1 builds predate Deep of Night slots — give them empty ones. View-only
  // imports from the retired share-link feature (shared: true) are dropped:
  // they were someone else's work, and nothing can display them anymore.
  const builds = d.builds
    .filter((b) => !(b as { shared?: boolean }).shared)
    .map((b) => ({
      ...b,
      deepSlots: b.deepSlots ?? [...EMPTY_SLOTS] as SlotTriple,
      variants: sanitizeVariants(b.variants),
      // Party-member snapshots carry their own relics — migrate those too.
      relics: b.relics?.map(gameRelicLines),
    }));
  const strings = (v: unknown[] | undefined) =>
    Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
  const declared = strings(d.tags);
  const declaredRelicTags = strings(d.relicTags);
  const customRelics = d.customRelics
    .map(migrateRelicLines)
    .map(gameRelicLines)
    // Relics from before the deep flag get a one-time guess, stored
    // explicitly so a user's later correction sticks.
    .map((r) => ({ ...r, deep: r.deep ?? inferDeep(r) }));
  return applyTombstones({
    version: 3,
    customRelics,
    builds,
    // Registry = declared tags plus any a build references (pre-tags stores
    // declare none), so every tag in use survives a merge or hand edit.
    tags: sortedTags([...declared, ...builds.flatMap((b) => b.tags ?? [])]),
    relicTags: sortedTags([...declaredRelicTags, ...customRelics.flatMap((r) => r.tags ?? [])]),
    // Stores written before tombstones existed simply have no deletions on
    // record — nothing to migrate.
    deleted: isTombstoneMap(d.deleted) ? d.deleted : {},
  });
}

/** A hand-edited or older store can carry anything here — take it only if it's the right shape. */
function isTombstoneMap(v: unknown): v is Record<string, number> {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.values(v).every((at) => typeof at === "number" && Number.isFinite(at))
  );
}

/** Dedupe + alphabetize a tag list (the registry's canonical form). */
export function sortedTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * The account's cached copy, or null when this browser has none for that uid
 * (call client-side only). The cache is a backup, not a second source of
 * truth: it's what the Builds page falls back to when the database can't be
 * reached, and what covers edits made in the seconds before a tab closed.
 */
export function loadCachedStore(uid: string): BuildStore | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    return normalizeStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Cache the store for one account (call client-side only). Returns false when
 * the write failed (quota exceeded or storage unavailable) — the account copy
 * is unaffected, but there's no offline fallback until it works again.
 */
export function cacheStore(uid: string, store: BuildStore): boolean {
  try {
    window.localStorage.setItem(cacheKey(uid), JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/**
 * Throw away one account's cached copy. Only for the case the cache can't
 * survive: the account's store being *replaced* rather than edited, where
 * merging the cache back in would resurrect what the replacement dropped
 * (see the dev seed loader).
 */
export function clearCachedStore(uid: string): void {
  try {
    window.localStorage.removeItem(cacheKey(uid));
  } catch {
    // Nothing readable to merge back in either.
  }
}

/**
 * Builds saved in this browser back when the page kept them here rather than
 * in an account — offered for import at the first sign-in and then done with
 * (see clearLegacyStore). Null once imported or turned down, and for an empty
 * store, which is nothing to ask about.
 */
export function loadLegacyStore(): BuildStore | null {
  try {
    if (window.localStorage.getItem(LEGACY_DONE_KEY) === "1") return null;
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const store = normalizeStore(JSON.parse(raw));
    if (!store || (store.builds.length === 0 && store.customRelics.length === 0)) return null;
    return store;
  } catch {
    return null;
  }
}

/**
 * Stop offering the legacy store. `discard` also removes it; turning the
 * import down only marks it answered, so a browser that still holds the only
 * copy of something keeps holding it.
 */
export function clearLegacyStore(discard = false): void {
  try {
    window.localStorage.setItem(LEGACY_DONE_KEY, "1");
    if (discard) window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage unavailable — there was nothing readable to offer either.
  }
}

/**
 * Merge an imported store into the current one (imported entries win by id).
 * Both sides' tombstones apply, so importing a backup taken before a deletion
 * doesn't hand the deleted entries back.
 */
export function mergeStores(current: BuildStore, imported: BuildStore): BuildStore {
  const mergeById = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return Array.from(map.values());
  };
  return applyTombstones({
    version: 3,
    builds: mergeById(current.builds, imported.builds),
    customRelics: mergeById(current.customRelics, imported.customRelics),
    tags: sortedTags([...current.tags, ...imported.tags]),
    relicTags: sortedTags([...(current.relicTags ?? []), ...(imported.relicTags ?? [])]),
    deleted: mergeTombstones(current.deleted, imported.deleted),
  });
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Path of one build's own page in the community directory. A static export
 * can't prerender /users/{uid}/{buildId}, so both ids ride the query string
 * (same trick as the profile links).
 *
 * `variantIdx` picks which loadout the page opens on — a build's variants are
 * separate takes worth linking to individually. Variant 0 is the build's own
 * loadout and stays out of the URL, and an index the build doesn't have falls
 * back to it (see variantIdxFromParam).
 */
export function buildPath(uid: string, buildId: string, variantIdx = 0): string {
  const v = variantIdx > 0 ? `&v=${variantIdx}` : "";
  return `/builds/users?u=${encodeURIComponent(uid)}&b=${encodeURIComponent(buildId)}${v}`;
}

/**
 * Path of one of your *own* builds on the Builds page — where it's editable,
 * as opposed to the directory's read-only view. `action` opens it
 * straight into the editor, or asks to delete it (the Builds page confirms
 * before anything goes). The uid rides along so a link passed on to someone
 * else is still recognisable as yours (see BuildsManager's withOwner).
 */
export function ownBuildPath(uid: string, buildId: string, action?: "edit" | "delete"): string {
  const suffix = action === "edit" ? "&edit=1" : action === "delete" ? "&delete=1" : "";
  return `/builds?b=${encodeURIComponent(buildId)}&u=${encodeURIComponent(uid)}${suffix}`;
}

/** The same link, absolute and base-path-aware — what Share copies. */
export function buildShareUrl(uid: string, buildId: string, variantIdx = 0): string {
  const path = asset(buildPath(uid, buildId, variantIdx));
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

/**
 * What Copy link actually puts on the clipboard: what the build *is*, a
 * blank line, then the link. Pasted into WhatsApp or Messenger a bare URL
 * says nothing until (and unless) a preview loads, so the caption carries
 * the name, Nightfarer and chalice — and the blank line keeps the URL alone
 * on its own line, which is what those apps linkify and unfurl.
 *
 * The link points at one loadout (see buildPath), so the caption names the
 * variant it opens on and quotes *that* loadout's chalice. Builds without
 * variants say nothing extra — there's only the one take.
 */
export function buildShareText(build: Build, url: string, variantIdx = 0): string {
  const name = build.name.trim() || "Unnamed build";
  const variant = variantCount(build) > 1 ? ` (${variantLabel(build, variantIdx)})` : "";
  return `${name}${variant} — ${build.character}, ${variantAt(build, variantIdx).chalice}\n\n${url}`;
}

/**
 * Whether two custom relics are the same relic: same deep-ness, same color,
 * and same effect lines (including each line's demerit). Re-importing a
 * relic that's already in the pool reuses the existing entry — a duplicate
 * relic in-game is just the one pool relic slotted twice.
 */
export function sameCustomRelic(
  a: Pick<CustomRelic, "color" | "effects" | "demerits" | "deep">,
  b: Pick<CustomRelic, "color" | "effects" | "demerits" | "deep">,
): boolean {
  if (!!a.deep !== !!b.deep) return false;
  const lines = (r: Pick<CustomRelic, "effects" | "demerits">) =>
    r.effects
      .map((e, i) => `${e.trim().toLowerCase()}|${(r.demerits?.[i] ?? "").trim().toLowerCase()}`)
      .filter((l) => l !== "|")
      .join("\n");
  return a.color === b.color && lines(a) === lines(b);
}

// ── Build snapshots (party planner) ──────────────────────────────────────
//  A self-contained copy of a build for travel: the build itself plus any
//  custom relics its slots reference. Fixed relics travel by name — they
//  ship with the app. The party planner stores one per member slot, and
//  party links pack them into positional arrays deflated into the URL hash
//  (see party.ts) — no server involved, the link *is* the data.

export interface SharedBuild {
  build: Omit<Build, "id" | "updatedAt">;
  relics: CustomRelic[];
}

// ── Limits on foreign data ───────────────────────────────────────────────
//  Builds are public: yours render in my browser, through the community
//  directory and through any party fielding them. A store is a JSON blob its
//  owner writes with their own credentials, so nothing stops someone editing
//  one by hand into a build named with fifty thousand characters — the input
//  caps in the editor bind the honest, not the determined.
//
//  So the caps that matter are applied on the way *in*, wherever another
//  account's data reaches this browser (see clampBuild / clampRelic and
//  their callers). Deliberately not applied to your own stored builds:
//  truncating those on load would edit your data and then persist it on the
//  next sync, which is a worse bug than a long name.
//
//  Generous on purpose. The longest real effect line is ~60 characters, the
//  longest chalice name ~30; these are an order of magnitude above anything
//  the game produces, and only ever catch abuse.
export const LIMITS = {
  buildName: 120,
  /** Not editable in the UI today, but carried in the model. */
  notes: 4000,
  relicName: 80,
  /** One effect or demerit line. */
  line: 200,
  tag: 40,
  tagsPer: 40,
  displayName: 60,
  /** Relics carried by one snapshot — six slots plus room for oddities. */
  relicsPerBuild: 24,
} as const;

/** Trim a foreign string to a sane length; anything but a string reads as "". */
export function clampText(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/**
 * JSON.parse for documents written by another account, with `__proto__` and
 * friends dropped on the way in.
 *
 * Object spread (which is how every parsed store and snapshot is rebuilt
 * here) defines own properties and so can't pollute a prototype on its own —
 * this is the belt to that pair of braces. It costs one reviver and takes the
 * whole question off the table, including for any future code that reaches
 * for Object.assign or a deep merge without thinking about where the object
 * came from. Returns null on malformed JSON rather than throwing.
 */
export function parseForeignJson(text: string): unknown {
  try {
    return JSON.parse(text, (key, value) =>
      key === "__proto__" || key === "constructor" || key === "prototype" ? undefined : value,
    );
  } catch {
    return null;
  }
}

const clampTags = (tags: string[] | undefined) =>
  Array.isArray(tags)
    ? tags.slice(0, LIMITS.tagsPer).map((t) => clampText(t, LIMITS.tag))
    : undefined;

/** One foreign relic, cut to size. Shape is left alone — only lengths move. */
export function clampRelic(r: CustomRelic): CustomRelic {
  const tags = clampTags(r.tags);
  return {
    ...r,
    name: clampText(r.name, LIMITS.relicName),
    effects: (Array.isArray(r.effects) ? r.effects : [])
      .slice(0, 3)
      .map((e) => clampText(e, LIMITS.line)),
    demerits: (Array.isArray(r.demerits) ? r.demerits : [])
      .slice(0, 3)
      .map((d) => clampText(d, LIMITS.line)),
    ...(tags ? { tags } : {}),
  };
}

/** One foreign build, cut to size, its own relics included. */
export function clampBuild<T extends Omit<Build, "id" | "updatedAt">>(build: T): T {
  const tags = clampTags(build.tags);
  return {
    ...build,
    name: clampText(build.name, LIMITS.buildName),
    notes: clampText(build.notes, LIMITS.notes),
    ...(tags ? { tags } : {}),
    ...(build.relics
      ? { relics: build.relics.slice(0, LIMITS.relicsPerBuild).map(clampRelic) }
      : {}),
  };
}

/** A foreign snapshot — the form a party slot travels and is stored in. */
export function clampSharedBuild(sb: SharedBuild): SharedBuild {
  return {
    build: clampBuild(sb.build),
    relics: (Array.isArray(sb.relics) ? sb.relics : [])
      .slice(0, LIMITS.relicsPerBuild)
      .map(clampRelic),
  };
}

/** A whole foreign store, for display only — never write the result back. */
export function clampStore(store: BuildStore): BuildStore {
  return {
    ...store,
    builds: store.builds.map(clampBuild),
    customRelics: store.customRelics.map(clampRelic),
    tags: (store.tags ?? []).slice(0, LIMITS.tagsPer).map((t) => clampText(t, LIMITS.tag)),
    relicTags: (store.relicTags ?? []).slice(0, LIMITS.tagsPer).map((t) => clampText(t, LIMITS.tag)),
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipeThrough(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

/** "" = empty slot, "f<name>" = fixed relic, "c<id>" = custom relic. */
type PackedSlot = string;

/** A build's positional wire form, as it rides in party links. */
export interface PackedBuild {
  /** [name, character, chalice, slots, deepSlots] */
  b: [string, string, string, PackedSlot[], PackedSlot[]];
  /**
   * [id, name, color, look, effects, demerits, deep?] per custom relic —
   * deep (0/1) was added later, so older links omit it and get inferDeep.
   */
  r: [string, string, CustomRelic["color"], string, string[], string[], (0 | 1)?][];
}

const packSlot = (s: BuildSlot): PackedSlot =>
  !s ? "" : s.kind === "fixed" ? `f${s.name}` : `c${s.id}`;

const unpackSlot = (s: unknown): BuildSlot => {
  if (typeof s !== "string" || s === "") return null;
  if (s[0] === "f") return { kind: "fixed", name: s.slice(1) };
  if (s[0] === "c") return { kind: "custom", id: s.slice(1) };
  return null;
};

/**
 * Snapshot a build for travel: only the wire fields (no id/timestamps, notes
 * and labels stay home) plus the custom relics its slots actually use.
 *
 * A build with variants is snapshotted one loadout at a time — variantIdx
 * picks which, and the snapshot carries that loadout as the build's own. A
 * party slot is one Nightfarer running one set of relics, so the variant is
 * chosen when the slot is filled rather than travelling as a tab strip.
 */
export function toSharedBuild(build: Build, store: BuildStore, variantIdx = 0): SharedBuild {
  const loadout = variantAt(build, Math.min(Math.max(variantIdx, 0), variantCount(build) - 1));
  const used = new Set(
    [...loadout.slots, ...loadout.deepSlots].flatMap((s) => (s?.kind === "custom" ? [s.id] : [])),
  );
  // A build that carries its own relics (a party-member snapshot) resolves
  // slots from those; the pool covers everything else.
  const byId = new Map<string, CustomRelic>();
  for (const r of [...store.customRelics, ...(build.relics ?? [])]) byId.set(r.id, r);
  // Clamped here because this is where a build stops being its owner's own
  // copy and becomes something other people's browsers render. A snapshot is
  // a copy, so trimming it never touches the build behind it.
  return clampSharedBuild({
    build: {
      name: build.name,
      character: build.character,
      chalice: loadout.chalice,
      slots: loadout.slots,
      deepSlots: loadout.deepSlots,
      notes: "",
    },
    relics: Array.from(byId.values()).filter((r) => used.has(r.id)),
  });
}

/** Pack a snapshot into the positional wire form. */
export function packSharedBuild(sb: SharedBuild): PackedBuild {
  return {
    b: [
      sb.build.name,
      sb.build.character,
      sb.build.chalice,
      sb.build.slots.map(packSlot),
      sb.build.deepSlots.map(packSlot),
    ],
    r: sb.relics.map((r) => [r.id, r.name, r.color, r.look ?? "", r.effects, r.demerits ?? [], r.deep ? 1 : 0]),
  };
}

/**
 * JSON → deflate-raw → base64url, "z"-prefixed. Old browsers without
 * CompressionStream ship the JSON as bare base64url (no prefix).
 */
export async function compressJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream === "undefined") return toBase64Url(bytes);
  return `z${toBase64Url(await pipeThrough(bytes, new CompressionStream("deflate-raw")))}`;
}

/** Inverse of compressJson; null when the payload doesn't decode or parse. */
export async function decompressJson(encoded: string): Promise<unknown> {
  try {
    const bytes = encoded.startsWith("z")
      ? await pipeThrough(fromBase64Url(encoded.slice(1)), new DecompressionStream("deflate-raw"))
      : fromBase64Url(encoded);
    // A payload out of a link someone pasted — foreign by definition.
    return parseForeignJson(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Unpack the positional wire form; null when it's malformed. */
export function unpackSharedBuild(d: PackedBuild): SharedBuild | null {
  const [name, character, chalice, slots, deepSlots] = d.b ?? [];
  if (
    typeof name !== "string" ||
    typeof character !== "string" ||
    typeof chalice !== "string" ||
    !Array.isArray(slots) ||
    slots.length !== 3 ||
    !Array.isArray(deepSlots) ||
    deepSlots.length !== 3 ||
    !Array.isArray(d.r)
  ) {
    return null;
  }
  return {
    build: {
      name,
      character,
      chalice,
      slots: slots.map(unpackSlot) as SlotTriple,
      deepSlots: deepSlots.map(unpackSlot) as SlotTriple,
      notes: "",
    },
    relics: d.r.map(([id, rName, color, look, effects, demerits, deep]) => {
      const relic: CustomRelic = {
        id: String(id),
        name: String(rName ?? ""),
        color,
        ...(look ? { look: look as RelicLook } : {}),
        effects: Array.isArray(effects) ? effects : [],
        demerits: Array.isArray(demerits) ? demerits : [],
      };
      // Links minted before the deep flag omit it — fall back to inference.
      return { ...relic, deep: deep === undefined ? inferDeep(relic) : deep === 1 };
    }),
  };
}

// ── Fixed relic options ──────────────────────────────────────────────────

export interface FixedRelicOption {
  name: string;
  color: Exclude<SlotColor, "White">;
  /** Icon path under /public. */
  icon: string;
  /** Where the relic comes from: "swap" = signboard stat swap; the rest mirror uniqueRelics. */
  group: "swap" | UniqueRelicGroup;
  /** Exclusive character, or undefined for all Nightfarers. */
  character?: string;
  effects: string[];
}

/** Signboard stat-swap relics, derived from the stat-swaps data. */
const signboardRelics: FixedRelicOption[] = characterSwaps.flatMap((c) =>
  c.swaps.flatMap((swap) => {
    if (!swap.relic.scene) return [];
    const meta = SCENE_META[swap.relic.scene];
    const scene = swap.relic.scene.charAt(0).toUpperCase() + swap.relic.scene.slice(1);
    return [{
      name: `Grand ${scene} Scene (${c.name} ${swap.label})`,
      color: meta.color as FixedRelicOption["color"],
      icon: relicIcon(swap.relic),
      group: "swap" as const,
      character: c.name,
      effects: swapRelicEffects(c, swap),
    }];
  }),
);

/** All fixed relics: unique relics (boss/shop/character) + signboard swaps. */
export const fixedRelics: FixedRelicOption[] = [
  ...uniqueRelics.map((r) => ({
    name: r.name,
    color: r.color as FixedRelicOption["color"],
    icon: `/icons/relics/${r.icon}`,
    group: r.group,
    character: r.character,
    effects: r.effects,
  })),
  ...signboardRelics,
];

/**
 * Fixed relics that fit a slot of the given color — every character's relics
 * are included (people do run other Nightfarers' relics); the current
 * character's own and the all-Nightfarer ones sort first.
 *
 * Deep of Night slots take no fixed relics at all: every Depth relic is
 * randomly rolled in-game, so they only ever exist here as custom relics.
 *
 * Exception: a signboard swap relic carries nothing but another character's
 * stat swap, so those only show for their own character.
 */
const ROLLABLE_NORMAL = new Set(NORMAL_EFFECT_VOCABULARY);
const normEffect = (s: string) => s.trim().toLowerCase();

/**
 * Identify a scanned relic as a fixed one from its effect lines alone (for
 * when OCR missed the relic-name header).
 * - `certain: true` — one of the effects can't roll on a random relic and
 *   exactly one fixed relic carries it, *and* nothing else that was scanned
 *   contradicts that relic.
 * - `certain: false` — every effect is rollable, but the set is an exact
 *   copy of the returned fixed relic's; could be the relic, could be a
 *   lucky roll, so ask before assuming.
 *
 * The contradiction check is what keeps a single line from carrying the whole
 * verdict, and it earns its keep: the lines handed in here have already been
 * snapped to the nearest catalogue entry, so one scanned effect the catalogue
 * is missing lands on whatever it reads closest to — an "Ultimate Art Auto
 * Charge +2" the catalogue doesn't list becomes the "+3" only Glass Necklace
 * carries. On its own that "proves" a relic the other two lines flatly rule
 * out. A rolled relic can carry fewer effects than the fixed one (OCR misses
 * lines), but never *other* ones.
 */
export function matchFixedByEffects(
  effects: string[],
): { relic: FixedRelicOption; certain: boolean } | null {
  const lines = effects.map((e) => e.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const carries = (r: FixedRelicOption, line: string) =>
    r.effects.some((e) => normEffect(e) === normEffect(line));
  const fixedOnly = lines.filter((l) => !ROLLABLE_NORMAL.has(l));
  if (fixedOnly.length > 0) {
    const carriers = fixedRelics.filter(
      (r) => fixedOnly.every((l) => carries(r, l)) && lines.every((l) => carries(r, l)),
    );
    if (carriers.length === 1) return { relic: carriers[0], certain: true };
  }
  const set = new Set(lines.map(normEffect));
  const exact = fixedRelics.find(
    (r) => r.effects.length === set.size && r.effects.every((e) => set.has(normEffect(e))),
  );
  return exact ? { relic: exact, certain: false } : null;
}

export function fixedRelicsFor(character: string, slotColor: SlotColor, deep = false): FixedRelicOption[] {
  if (deep) return [];
  const fits = fixedRelics.filter(
    (r) =>
      (slotColor === "White" || r.color === slotColor) &&
      (r.group !== "swap" || r.character === character),
  );
  const rank = (r: FixedRelicOption) => (!r.character ? 0 : r.character === character ? 1 : 2);
  return fits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
