// ─────────────────────────────────────────────────────────────────────────
//  User builds — stored entirely in localStorage (no backend). A build is a
//  character + chalice + three relic slots (plus three Deep of Night slots);
//  each slot holds either a fixed relic from the app's data or a
//  user-created custom relic.
// ─────────────────────────────────────────────────────────────────────────

import { characterSwaps } from "@/data/statSwaps";
import { uniqueRelics } from "@/data/uniqueRelics";
import { SCENE_META } from "@/lib/statSwaps";
import type { SlotColor } from "@/lib/chalices";

export interface CustomRelic {
  id: string;
  /** Optional display name; falls back to "<Color> relic". */
  name: string;
  color: Exclude<SlotColor, "White">;
  /** 1–3 effect lines (canonical names when matched from the catalogue). */
  effects: string[];
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
  version: 2;
  builds: Build[];
  customRelics: CustomRelic[];
}

const STORAGE_KEY = "nightreign-builds";

export const EMPTY_STORE: BuildStore = { version: 2, builds: [], customRelics: [] };

export const EMPTY_SLOTS: SlotTriple = [null, null, null];

/** Validate/migrate a parsed store of any known version; null if unusable. */
export function normalizeStore(data: unknown): BuildStore | null {
  const d = data as { version?: number; builds?: Build[]; customRelics?: CustomRelic[] };
  if (!d || !Array.isArray(d.builds) || !Array.isArray(d.customRelics)) return null;
  if (d.version !== 1 && d.version !== 2) return null;
  return {
    version: 2,
    customRelics: d.customRelics,
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
    version: 2,
    builds: mergeById(current.builds, imported.builds),
    customRelics: mergeById(current.customRelics, imported.customRelics),
  };
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
