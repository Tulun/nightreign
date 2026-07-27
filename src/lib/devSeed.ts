"use client";

// ─────────────────────────────────────────────────────────────────────────
//  DEV SEED LOADER  ·  ?seed=<name> on localhost
// ─────────────────────────────────────────────────────────────────────────
//  Replaces the localStorage build store with a fixture from data/devSeeds
//  so a populated app is one navigation away. Two guards keep it from ever
//  touching anything real:
//
//  1. dev builds on localhost only — the deployed site parses no seed at
//     all, and neither does a production build served locally (there the
//     seeded-store backstop in useCloudSync is compiled out). The fixture
//     itself is dynamically imported by the caller, so visitors never
//     download it.
//  2. Signed out only — useCloudSync merges the local store into the
//     account and pushes the union, so seeding while signed in would write
//     fixture builds into a real Firestore account. A persisted Firebase
//     auth session is a hard refusal.
// ─────────────────────────────────────────────────────────────────────────

import { normalizeStore, saveStore, type BuildStore } from "@/lib/builds";

/** Query parameter that triggers a seed load. */
export const DEV_SEED_PARAM = "seed";

/** Query parameter that drives the stub backend (fake-cloud mode only). */
export const CLOUD_PARAM = "cloud";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

/**
 * Whether seeding is permitted here at all — dev machines only. The NODE_ENV
 * check also rules out a production build served on localhost (preview:pages):
 * there the seeded-store backstop in useCloudSync is compiled out, so seeding
 * followed by a real sign-in would sync fixtures into a real account.
 */
export function devSeedAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const host = window.location.hostname;
  return LOCAL_HOSTS.has(host) || host.endsWith(".local");
}

/**
 * Whether a Firebase auth session is persisted in this browser. Firebase
 * stores it as `firebase:authUser:<apiKey>:[DEFAULT]`, written before our
 * code runs, so this answers "is someone signed in?" synchronously —
 * onAuthStateChanged would only tell us after the seed had already landed.
 */
export function hasAuthSession(): boolean {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      if (window.localStorage.key(i)?.startsWith("firebase:authUser:")) return true;
    }
  } catch {
    // Storage unavailable — nothing to seed into either, so let the write fail.
  }
  return false;
}

export type SeedResult = { ok: true; name: string } | { ok: false; reason: string };

/**
 * Marks the store as fixture data. Refusing to seed while signed in only
 * covers one order of events — seed first, sign in after, and useCloudSync
 * would merge the fixtures into a real account and push them. This marker is
 * what that hook refuses on (dev builds only, see useCloudSync); an `empty`
 * seed clears it, since a wiped store is safe to sync again.
 */
export const SEEDED_KEY = "nightreign-dev-seeded";

/** Whether this browser holds a seeded store that must not reach an account. */
export function hasSeededStore(): boolean {
  try {
    return window.localStorage.getItem(SEEDED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Write a fixture over the current store. The fixture goes through
 * normalizeStore first: the same validation a real store gets on load, so a
 * broken fixture is caught here rather than showing up as odd UI later.
 */
export function applyDevSeed(name: string, build: (now: number) => BuildStore): SeedResult {
  if (!devSeedAllowed()) return { ok: false, reason: "Seeds only load on localhost." };
  if (hasAuthSession()) {
    return {
      ok: false,
      reason:
        "Sign out before seeding — a seeded store would sync into the signed-in account.",
    };
  }
  const store = normalizeStore(build(Date.now()));
  if (!store) return { ok: false, reason: `Seed "${name}" isn't a valid store (fixture bug).` };
  if (!saveStore(store)) return { ok: false, reason: "Couldn't write to localStorage." };
  try {
    const fixtures = store.builds.length > 0 || store.customRelics.length > 0;
    if (fixtures) window.localStorage.setItem(SEEDED_KEY, "1");
    else window.localStorage.removeItem(SEEDED_KEY);
  } catch {
    // Marker unwritable: saveStore would have failed too, so there's no
    // seeded store to protect.
  }
  return { ok: true, name };
}
