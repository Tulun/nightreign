"use client";

// ─────────────────────────────────────────────────────────────────────────
//  DEV SEED LOADER  ·  ?seed=<name> on localhost, stub backend only
// ─────────────────────────────────────────────────────────────────────────
//  Loads a fixture from data/devSeeds into the stub backend's own account
//  (see lib/fakeCloud) and signs in as it, so a populated Builds / My Relics
//  / party planner is one navigation away.
//
//  Builds live in an account now, which is what makes this safe: there is no
//  local store to seed, and the only account a seed can reach is the stub's.
//  Two guards keep it that way:
//
//  1. dev builds on localhost only — the deployed site parses no seed at all.
//  2. the stub backend only (npm run dev:fake). Against real Firebase the
//     seed refuses outright rather than writing fixtures into a real account.
// ─────────────────────────────────────────────────────────────────────────

import { normalizeStore, type BuildStore } from "@/lib/builds";

/** Query parameter that triggers a seed load. */
export const DEV_SEED_PARAM = "seed";

/** Query parameter that drives the stub backend (fake-cloud mode only). */
export const CLOUD_PARAM = "cloud";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

/**
 * Whether seeding is permitted here at all — dev machines only. The NODE_ENV
 * check also rules out a production build served on localhost (preview:pages).
 */
export function devSeedAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const host = window.location.hostname;
  return LOCAL_HOSTS.has(host) || host.endsWith(".local");
}

export type SeedResult = { ok: true; store: BuildStore } | { ok: false; reason: string };

/**
 * Build a fixture and check it over before anything is written. The fixture
 * goes through normalizeStore — the same validation a stored store gets on
 * load — so a broken fixture is caught here rather than showing up as odd UI
 * later.
 */
export function prepareSeed(name: string, build: (now: number) => BuildStore): SeedResult {
  if (!devSeedAllowed()) return { ok: false, reason: "Seeds only load on localhost." };
  const store = normalizeStore(build(Date.now()));
  if (!store) return { ok: false, reason: `Seed "${name}" isn't a valid store (fixture bug).` };
  return { ok: true, store };
}
