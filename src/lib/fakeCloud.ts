"use client";

// ─────────────────────────────────────────────────────────────────────────
//  FAKE CLOUD  ·  a stand-in for Firebase Auth + Firestore, in localStorage
// ─────────────────────────────────────────────────────────────────────────
//  Reached only through lib/cloud.ts, and only when the dev server runs with
//  NEXT_PUBLIC_FAKE_CLOUD=1. Nothing here talks to Firebase, so signing in,
//  browsing the directory, publishing a party and resolving a sign-in merge
//  all work offline, deterministically, and without a real account taking on
//  test data. What it deliberately does NOT test: security rules, and the
//  real popup sign-in.
//
//  State lives under one localStorage key so it survives reloads (a merge
//  test needs the "cloud" to remember what the last push left behind), and
//  is seeded from data/devUsers on first use.
//
//  Reads mimic the real ones in two ways that matter: a short delay, so
//  loading states are actually observable, and CloudReadError failures —
//  globally via the scenario, or per-account for BROKEN_UID. Writes always
//  succeed; rule rejections are exactly what this can't model.
//
//  In fake mode `window.__fakeCloud` is the console handle: scenario(),
//  signIn(), remoteEdit() and friends drive the states a real backend would
//  make you set up by hand.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { CloudReadError, type CloudErrorKind } from "@/lib/cloudRead";
import { normalizeStore, type BuildStore } from "@/lib/builds";
import { normalizeParty, type Party, type PartySummary, type CloudParty } from "@/lib/party";
import type { UserProfile } from "@/lib/cloudSync";
import { BROKEN_UID, SELF_UID, fakeFixtures } from "@/data/devUsers";

const KEY = "nightreign-fake-cloud";

/** How long a fake read takes — enough to see a spinner, not enough to annoy. */
const LATENCY_MS = 150;

/**
 * `full` is the normal world. `empty` is a directory with nobody in it; the
 * rest make every read fail with that CloudReadError kind, which is how the
 * "couldn't reach the build database" copy gets exercised.
 */
export type Scenario = "full" | "empty" | "timeout" | "denied" | "unavailable";

interface StoredProfile {
  displayName: string | null;
  updatedAt: number | null;
  buildCount: number;
  /** Serialized BuildStore, or null for an account that never synced. */
  store: string | null;
}

interface StoredParty {
  party: string;
  name: string;
  blurb: string;
  roster: (string | null)[];
  ownerUid: string | null;
  updatedAt: number;
}

interface State {
  scenario: Scenario;
  signedInUid: string | null;
  profiles: Record<string, StoredProfile>;
  parties: Record<string, StoredParty>;
}

// ── State ────────────────────────────────────────────────────────────────

let cache: State | null = null;

function seeded(): State {
  const { profiles, parties } = fakeFixtures(Date.now());
  return {
    scenario: "full",
    signedInUid: null,
    profiles: Object.fromEntries(
      profiles.map((p) => [
        p.uid,
        {
          displayName: p.displayName,
          updatedAt: p.updatedAt,
          buildCount: p.store?.builds.length ?? 0,
          store: p.store ? JSON.stringify(p.store) : null,
        },
      ]),
    ),
    parties: Object.fromEntries(
      parties.map((p) => [
        p.id,
        {
          party: JSON.stringify(p.party),
          name: p.party.name,
          blurb: p.party.blurb,
          roster: p.party.slots.map((s) => (s ? s.build.build.character : null)),
          ownerUid: p.ownerUid,
          updatedAt: p.updatedAt,
        },
      ]),
    ),
  };
}

function read(): State {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) cache = JSON.parse(raw) as State;
  } catch {
    // Unreadable state is no worse than none — reseed over it.
  }
  if (!cache) {
    cache = seeded();
    write(cache);
  }
  attachConsoleHandle();
  return cache;
}

function write(next: State): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: the in-memory copy still serves this session.
  }
}

function update(fn: (s: State) => State): State {
  const next = fn(read());
  write(next);
  return next;
}

/** Throw back to fixtures — the fake equivalent of wiping the database. */
export function resetFakeCloud(): void {
  write(seeded());
  authListeners.forEach((l) => l(null));
  storeListeners.forEach((set, uid) => set.forEach((l) => notifyStore(uid, l)));
}

export function setScenario(scenario: Scenario): void {
  update((s) => ({ ...s, scenario }));
}

// ── Read gate ────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Every fake read goes through here: the latency, plus the failure the
 * current scenario (or the deliberately-broken account) asks for.
 */
async function gate(uid?: string): Promise<State> {
  const s = read();
  await sleep(LATENCY_MS);
  if (s.scenario !== "full" && s.scenario !== "empty") {
    throw new CloudReadError(s.scenario as CloudErrorKind);
  }
  if (uid && uid === BROKEN_UID) throw new CloudReadError("timeout");
  return s;
}

const isEmpty = (s: State) => s.scenario === "empty";

const defaultHandle = (uid: string) => `Nightfarer-${uid.slice(0, 4)}`;

// ── Auth ─────────────────────────────────────────────────────────────────

type AuthListener = (user: User | null) => void;
const authListeners = new Set<AuthListener>();

/** Just enough of a Firebase User for the call sites (uid, displayName). */
function fakeUser(uid: string, displayName: string | null): User {
  return { uid, displayName, email: null, photoURL: null, isAnonymous: false } as unknown as User;
}

/** Who the stub currently has signed in, if anyone. */
export function signedInUid(): string | null {
  return read().signedInUid;
}

function currentUser(): User | null {
  const s = read();
  if (!s.signedInUid) return null;
  return fakeUser(s.signedInUid, s.profiles[s.signedInUid]?.displayName ?? null);
}

export function useAuth(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    // Deferred one tick so the "restoring auth state" first paint still
    // happens — components branch on `undefined` and it should be reachable.
    const t = setTimeout(() => setUser(currentUser()), 0);
    const listener: AuthListener = (u) => setUser(u);
    authListeners.add(listener);
    return () => {
      clearTimeout(t);
      authListeners.delete(listener);
    };
  }, []);
  return user;
}

/** No popup, no Google: signs in as the fixture account. */
export async function signInWithGoogle(uid = SELF_UID): Promise<void> {
  const s = update((prev) => ({ ...prev, signedInUid: uid }));
  const user = fakeUser(uid, s.profiles[uid]?.displayName ?? null);
  authListeners.forEach((l) => l(user));
}

export async function signOutUser(): Promise<void> {
  update((s) => ({ ...s, signedInUid: null }));
  authListeners.forEach((l) => l(null));
}

// ── Profiles + stores ────────────────────────────────────────────────────

export async function listProfiles(): Promise<UserProfile[]> {
  const s = await gate();
  if (isEmpty(s)) return [];
  return Object.entries(s.profiles)
    .map(([uid, p]) => ({
      uid,
      displayName: p.displayName ?? defaultHandle(uid),
      buildCount: p.buildCount,
      updatedAt: p.updatedAt,
    }))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function pullCloudStore(uid: string): Promise<BuildStore | null> {
  const s = await gate(uid);
  const raw = s.profiles[uid]?.store;
  if (typeof raw !== "string") return null;
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function pushCloudStore(user: User, store: BuildStore): Promise<void> {
  update((s) => ({
    ...s,
    profiles: {
      ...s.profiles,
      [user.uid]: {
        displayName: s.profiles[user.uid]?.displayName ?? null,
        buildCount: store.builds.length,
        updatedAt: Date.now(),
        store: JSON.stringify(store),
      },
    },
  }));
  // No self-notification: the real watcher skips its own writes, and
  // useCloudSync would treat an echo as a remote change.
}

export async function upsertProfile(user: User, store: BuildStore): Promise<void> {
  update((s) => ({
    ...s,
    profiles: {
      ...s.profiles,
      [user.uid]: {
        displayName: s.profiles[user.uid]?.displayName ?? null,
        buildCount: store.builds.length,
        updatedAt: Date.now(),
        store: s.profiles[user.uid]?.store ?? null,
      },
    },
  }));
}

export async function ensureProfileName(user: User): Promise<void> {
  const existing = read().profiles[user.uid]?.displayName;
  if (existing && existing.trim()) return;
  await setProfileName(user.uid, defaultHandle(user.uid));
}

export async function getProfileName(uid: string): Promise<string | null> {
  const s = await gate(uid);
  const name = s.profiles[uid]?.displayName;
  return name && name.trim() ? name : null;
}

export async function setProfileName(uid: string, name: string): Promise<void> {
  update((s) => ({
    ...s,
    profiles: {
      ...s.profiles,
      [uid]: {
        displayName: name.trim(),
        buildCount: s.profiles[uid]?.buildCount ?? 0,
        updatedAt: s.profiles[uid]?.updatedAt ?? null,
        store: s.profiles[uid]?.store ?? null,
      },
    },
  }));
  const signedIn = currentUser();
  if (signedIn?.uid === uid) {
    authListeners.forEach((l) => l(fakeUser(uid, name.trim())));
  }
}

// ── Live store watch ─────────────────────────────────────────────────────

type StoreListener = (store: BuildStore) => void;
const storeListeners = new Map<string, Set<StoreListener>>();

function notifyStore(uid: string, listener: StoreListener): void {
  const raw = read().profiles[uid]?.store;
  if (typeof raw !== "string") return;
  try {
    const parsed = normalizeStore(JSON.parse(raw));
    if (parsed) listener(parsed);
  } catch {
    // Same as the real watcher: an unparseable copy is nothing to act on.
  }
}

export function watchCloudStore(uid: string, onChange: StoreListener): () => void {
  const set = storeListeners.get(uid) ?? new Set<StoreListener>();
  set.add(onChange);
  storeListeners.set(uid, set);
  return () => set.delete(onChange);
}

/**
 * Stand in for another device pushing an edit: mutate the account's stored
 * copy and fire the watchers, which is the only way to reach the live-merge
 * branch of useCloudSync without a second signed-in browser.
 */
export function remoteEdit(uid: string, mutate: (store: BuildStore) => BuildStore): void {
  const raw = read().profiles[uid]?.store;
  const current = raw ? normalizeStore(JSON.parse(raw)) : null;
  if (!current) {
    console.warn(`[fakeCloud] ${uid} has no store to edit`);
    return;
  }
  const next = mutate(current);
  update((s) => ({
    ...s,
    profiles: {
      ...s.profiles,
      [uid]: {
        ...s.profiles[uid],
        buildCount: next.builds.length,
        updatedAt: Date.now(),
        store: JSON.stringify(next),
      },
    },
  }));
  storeListeners.get(uid)?.forEach((l) => notifyStore(uid, l));
}

// ── Parties ──────────────────────────────────────────────────────────────

export async function listParties(): Promise<PartySummary[]> {
  const s = await gate();
  if (isEmpty(s)) return [];
  return Object.entries(s.parties)
    .map(([id, p]) => ({
      id,
      name: p.name,
      blurb: p.blurb,
      roster: p.roster,
      ownerUid: p.ownerUid,
      updatedAt: p.updatedAt,
    }))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function fetchParty(id: string): Promise<CloudParty | null> {
  const s = await gate();
  const row = s.parties[id];
  if (!row) return null;
  try {
    const party = normalizeParty(JSON.parse(row.party));
    if (!party) return null;
    return { party: { ...party, id }, ownerUid: row.ownerUid };
  } catch {
    return null;
  }
}

export async function publishParty(party: Party, ownerUid: string): Promise<string> {
  // newId() is random and the fixtures must stay deterministic, so a
  // never-published party gets a counted id instead.
  const id = party.id ?? `fake-party-${Object.keys(read().parties).length + 1}`;
  update((s) => ({
    ...s,
    parties: {
      ...s.parties,
      [id]: {
        party: JSON.stringify({ ...party, id }),
        name: party.name.trim(),
        blurb: party.blurb.trim(),
        roster: party.slots.map((sl) => (sl ? sl.build.build.character : null)),
        ownerUid,
        updatedAt: Date.now(),
      },
    },
  }));
  return id;
}

export async function deleteParty(id: string): Promise<void> {
  update((s) => {
    const parties = { ...s.parties };
    delete parties[id];
    return { ...s, parties };
  });
}

// ── Console handle ───────────────────────────────────────────────────────

let attached = false;

/**
 * Attached lazily (never at module scope) so this file stays free of
 * side effects and drops out of a production build entirely.
 */
function attachConsoleHandle(): void {
  if (attached || typeof window === "undefined") return;
  attached = true;
  (window as unknown as Record<string, unknown>).__fakeCloud = {
    state: () => read(),
    reset: resetFakeCloud,
    scenario: setScenario,
    signIn: signInWithGoogle,
    signOut: signOutUser,
    remoteEdit,
  };
  console.info(
    "[fakeCloud] active — window.__fakeCloud: state(), reset(), scenario('full'|'empty'|'timeout'|'denied'|'unavailable'), signIn(uid?), signOut(), remoteEdit(uid, fn)",
  );
}
