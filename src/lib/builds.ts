// ─────────────────────────────────────────────────────────────────────────
//  User builds — stored entirely in localStorage (no backend). A build is a
//  character + chalice + three relic slots (plus three Deep of Night slots);
//  each slot holds either a fixed relic from the app's data or a
//  user-created custom relic.
// ─────────────────────────────────────────────────────────────────────────

import { characterSwaps } from "@/data/statSwaps";
import { uniqueRelics } from "@/data/uniqueRelics";
import { isCurseEffect } from "@/lib/effectMatch";
import { SCENE_META } from "@/lib/statSwaps";
import type { SlotColor } from "@/lib/chalices";

export interface CustomRelic {
  id: string;
  /** Optional display name; falls back to "<Color> relic". */
  name: string;
  color: Exclude<SlotColor, "White">;
  /** Up to 3 effect lines. */
  effects: string[];
  /** Per-line demerits (Deep relics): demerits[i] belongs to effects[i]. */
  demerits: string[];
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
  updatedAt: number;
}

export interface BuildStore {
  version: 3;
  builds: Build[];
  customRelics: CustomRelic[];
}

const STORAGE_KEY = "nightreign-builds";

export const EMPTY_STORE: BuildStore = { version: 3, builds: [], customRelics: [] };

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
  const d = data as { version?: number; builds?: Build[]; customRelics?: CustomRelic[] };
  if (!d || !Array.isArray(d.builds) || !Array.isArray(d.customRelics)) return null;
  if (d.version !== 1 && d.version !== 2 && d.version !== 3) return null;
  return {
    version: 3,
    customRelics: d.customRelics.map(migrateRelicLines),
    // v1 builds predate Deep of Night slots — give them empty ones.
    builds: d.builds.map((b) => ({ ...b, deepSlots: b.deepSlots ?? [...EMPTY_SLOTS] as SlotTriple })),
  };
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

/** Persist the store to localStorage (call client-side only). */
export function saveStore(store: BuildStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or storage unavailable — nothing sensible to do.
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
  };
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Whether two custom relics are the same relic: same color and same effect
 * lines (including each line's demerit). Re-importing a relic that's already
 * in the pool reuses the existing entry — a duplicate relic in-game is just
 * the one pool relic slotted twice.
 */
export function sameCustomRelic(
  a: Pick<CustomRelic, "color" | "effects" | "demerits">,
  b: Pick<CustomRelic, "color" | "effects" | "demerits">,
): boolean {
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
//  ship with the app. No server involved; the link *is* the data.

export interface SharedBuild {
  build: Omit<Build, "id" | "updatedAt">;
  relics: CustomRelic[];
}

/** Encode a build and the custom relics it uses into a URL-safe string. */
export function encodeSharedBuild(build: Build, store: BuildStore): string {
  const used = new Set(
    [...build.slots, ...build.deepSlots].flatMap((s) => (s?.kind === "custom" ? [s.id] : [])),
  );
  const payload = {
    v: 1,
    build: {
      name: build.name,
      character: build.character,
      chalice: build.chalice,
      slots: build.slots,
      deepSlots: build.deepSlots,
      notes: build.notes,
    },
    relics: store.customRelics.filter((r) => used.has(r.id)),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Decode a shared-build payload; null if it isn't one. */
export function decodeSharedBuild(encoded: string): SharedBuild | null {
  try {
    const bin = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(bytes)) as {
      v?: number;
      build?: SharedBuild["build"];
      relics?: CustomRelic[];
    };
    const b = d.build;
    if (
      d.v !== 1 ||
      !b ||
      typeof b.character !== "string" ||
      !Array.isArray(b.slots) ||
      b.slots.length !== 3 ||
      !Array.isArray(b.deepSlots) ||
      b.deepSlots.length !== 3 ||
      !Array.isArray(d.relics)
    ) {
      return null;
    }
    return { build: b, relics: d.relics.map(migrateRelicLines) };
  } catch {
    return null;
  }
}

// ── Fixed relic options ──────────────────────────────────────────────────

export interface FixedRelicOption {
  name: string;
  color: Exclude<SlotColor, "White">;
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
    character: r.character,
    effects: r.effects,
  })),
  ...signboardRelics,
];

/**
 * Fixed relics that fit a slot of the given color — every character's relics
 * are included (people do run other Nightfarers' relics); the current
 * character's own and the all-Nightfarer ones sort first.
 */
export function fixedRelicsFor(character: string, slotColor: SlotColor): FixedRelicOption[] {
  const fits = fixedRelics.filter((r) => slotColor === "White" || r.color === slotColor);
  const rank = (r: FixedRelicOption) => (!r.character ? 0 : r.character === character ? 1 : 2);
  return fits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
