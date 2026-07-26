// ─────────────────────────────────────────────────────────────────────────
//  User builds — stored in localStorage, optionally mirrored to a Firestore
//  account (see cloudSync.ts / useCloudSync.ts). A build is a
//  character + chalice + three relic slots (plus three Deep of Night slots);
//  each slot holds either a fixed relic from the app's data or a
//  user-created custom relic.
// ─────────────────────────────────────────────────────────────────────────

import { characterSwaps } from "@/data/statSwaps";
import { uniqueRelics, type UniqueRelicGroup } from "@/data/uniqueRelics";
import { NORMAL_EFFECT_VOCABULARY, isCurseEffect } from "@/lib/effectMatch";
import { SCENE_META, relicIcon } from "@/lib/statSwaps";
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
  /**
   * User-added subtitle shown under the name — mainly for re-labeling a
   * poorly titled shared build. Never travels with the share link.
   */
  subtitle?: string;
  updatedAt: number;
  /**
   * Community-profile visibility: undefined/true = shown on your profile,
   * false = hidden. Nothing sets it to false yet — every build is public
   * until a private/public toggle ships.
   */
  public?: boolean;
  /** True for builds imported from a share link — view-only, not editable. */
  shared?: boolean;
  /**
   * Build-scoped custom relics for shared imports. Slots of a shared build
   * resolve against these instead of the user's pool, so viewing a friend's
   * build never adds their relics to your collection.
   */
  relics?: CustomRelic[];
}

export interface BuildStore {
  version: 3;
  builds: Build[];
  customRelics: CustomRelic[];
  /** User-managed tag registry for organizing builds (kept sorted). */
  tags: string[];
}

const STORAGE_KEY = "nightreign-builds";

export const EMPTY_STORE: BuildStore = { version: 3, builds: [], customRelics: [], tags: [] };

export const EMPTY_SLOTS: SlotTriple = [null, null, null];

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

/** Validate/migrate a parsed store of any known version; null if unusable. */
export function normalizeStore(data: unknown): BuildStore | null {
  const d = data as {
    version?: number;
    builds?: Build[];
    customRelics?: CustomRelic[];
    tags?: unknown[];
  };
  if (!d || !Array.isArray(d.builds) || !Array.isArray(d.customRelics)) return null;
  if (d.version !== 1 && d.version !== 2 && d.version !== 3) return null;
  // v1 builds predate Deep of Night slots — give them empty ones.
  const builds = d.builds.map((b) => ({ ...b, deepSlots: b.deepSlots ?? [...EMPTY_SLOTS] as SlotTriple }));
  const declared = Array.isArray(d.tags) ? d.tags.filter((t): t is string => typeof t === "string") : [];
  return {
    version: 3,
    // Relics from before the deep flag get a one-time guess, stored
    // explicitly so a user's later correction sticks.
    customRelics: d.customRelics
      .map(migrateRelicLines)
      .map((r) => ({ ...r, deep: r.deep ?? inferDeep(r) })),
    builds,
    // Registry = declared tags plus any a build references (pre-tags stores
    // declare none), so every tag in use survives a merge or hand edit.
    tags: sortedTags([...declared, ...builds.flatMap((b) => b.tags ?? [])]),
  };
}

/** Dedupe + alphabetize a tag list (the registry's canonical form). */
export function sortedTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Load the store from localStorage (call client-side only). */
export function loadStore(): BuildStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    return normalizeStore(JSON.parse(raw)) ?? EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
}

/**
 * Persist the store to localStorage (call client-side only). Returns false
 * when the write failed (quota exceeded or storage unavailable) — the
 * in-memory state is then ahead of what's on disk, and the caller should
 * warn the user rather than let edits silently evaporate on reload.
 */
export function saveStore(store: BuildStore): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/** Merge an imported store into the current one (imported entries win by id). */
export function mergeStores(current: BuildStore, imported: BuildStore): BuildStore {
  const mergeById = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return Array.from(map.values());
  };
  return {
    version: 3,
    builds: mergeById(current.builds, imported.builds),
    customRelics: mergeById(current.customRelics, imported.customRelics),
    tags: sortedTags([...current.tags, ...imported.tags]),
  };
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

// ── Build sharing ────────────────────────────────────────────────────────
//  A build travels as a URL hash (#b=<payload>): the build itself plus any
//  custom relics its slots reference. Fixed relics travel by name — they
//  ship with the app. No server involved; the link *is* the data, which is
//  why it can't be a short opaque id. To keep it as small as possible, v2
//  packs the build into positional arrays and deflates it (payloads starting
//  with "z"); v1 links (bare base64 JSON) still decode.

export interface SharedBuild {
  build: Omit<Build, "id" | "updatedAt">;
  relics: CustomRelic[];
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

/** A build's positional wire form — shared by build links and party links. */
export interface PackedBuild {
  /** [name, character, chalice, slots, deepSlots] */
  b: [string, string, string, PackedSlot[], PackedSlot[]];
  /**
   * [id, name, color, look, effects, demerits, deep?] per custom relic —
   * deep (0/1) was added later, so older links omit it and get inferDeep.
   */
  r: [string, string, CustomRelic["color"], string, string[], string[], (0 | 1)?][];
}

interface V2Payload extends PackedBuild {
  v: 2;
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
 */
export function toSharedBuild(build: Build, store: BuildStore): SharedBuild {
  const used = new Set(
    [...build.slots, ...build.deepSlots].flatMap((s) => (s?.kind === "custom" ? [s.id] : [])),
  );
  // A shared (view-only) build resolves its slots from its own relics, so
  // re-sharing one must draw from those; the pool covers everything else.
  const byId = new Map<string, CustomRelic>();
  for (const r of [...store.customRelics, ...(build.relics ?? [])]) byId.set(r.id, r);
  return {
    build: {
      name: build.name,
      character: build.character,
      chalice: build.chalice,
      slots: build.slots,
      deepSlots: build.deepSlots,
      notes: "",
    },
    relics: Array.from(byId.values()).filter((r) => used.has(r.id)),
  };
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
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Encode a build and the custom relics it uses into a URL-safe string. */
export async function encodeSharedBuild(build: Build, store: BuildStore): Promise<string> {
  const payload: V2Payload = { v: 2, ...packSharedBuild(toSharedBuild(build, store)) };
  return compressJson(payload);
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

/** Decode a shared-build payload (v1 or v2); null if it isn't one. */
export async function decodeSharedBuild(encoded: string): Promise<SharedBuild | null> {
  const d = (await decompressJson(encoded)) as
    | V2Payload
    | { v?: number; build?: SharedBuild["build"]; relics?: CustomRelic[] }
    | null;
  if (!d || typeof d !== "object") return null;
  if (d.v === 2) return unpackSharedBuild(d as V2Payload);
  const b = (d as { build?: SharedBuild["build"] }).build;
  const relics = (d as { relics?: CustomRelic[] }).relics;
  if (
    d.v !== 1 ||
    !b ||
    typeof b.character !== "string" ||
    !Array.isArray(b.slots) ||
    b.slots.length !== 3 ||
    !Array.isArray(b.deepSlots) ||
    b.deepSlots.length !== 3 ||
    !Array.isArray(relics)
  ) {
    return null;
  }
  return {
    build: b,
    relics: relics.map(migrateRelicLines).map((r) => ({ ...r, deep: r.deep ?? inferDeep(r) })),
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
      effects: [`[${c.name}] ${swap.label} stat swap`],
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
 *   exactly one fixed relic carries it, so it has to be that relic.
 * - `certain: false` — every effect is rollable, but the set is an exact
 *   copy of the returned fixed relic's; could be the relic, could be a
 *   lucky roll, so ask before assuming.
 */
export function matchFixedByEffects(
  effects: string[],
): { relic: FixedRelicOption; certain: boolean } | null {
  const lines = effects.map((e) => e.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const fixedOnly = lines.filter((l) => !ROLLABLE_NORMAL.has(l));
  if (fixedOnly.length > 0) {
    const carriers = fixedRelics.filter((r) =>
      fixedOnly.every((l) => r.effects.some((e) => normEffect(e) === normEffect(l))),
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
