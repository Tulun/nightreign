"use client";

// ─────────────────────────────────────────────────────────────────────────
//  CLOUD FACADE  ·  the real backend, or the dev stub
// ─────────────────────────────────────────────────────────────────────────
//  Every component reaches auth, the build-store sync and published parties
//  through this module, so swapping in the fake backend is one flag rather
//  than an edit in eight files:
//
//    NEXT_PUBLIC_FAKE_CLOUD=1 npm run dev     (or: npm run dev:fake)
//
//  The flag is an env var and not the hostname check the ?seed= loader uses:
//  swapping out auth is invasive enough that it should take a deliberate
//  restart, and a plain `npm run dev` must still exercise the real thing.
//  Next inlines the value at build time, so the ternaries below fold to a
//  constant and the fake modules drop out of a production bundle.
//
//  mergeWithCloud is deliberately NOT swapped: it's pure, and it's usually
//  the thing under test.
//
//  A plain `npm run dev` still reads the real database, but does not write to
//  it — see CLOUD_READONLY below.
// ─────────────────────────────────────────────────────────────────────────

import * as realSync from "@/lib/cloudSync";
import * as realAuth from "@/lib/useAuth";
import * as realParty from "@/lib/party";
import * as fake from "@/lib/fakeCloud";

/** True when this build talks to the stub instead of Firebase. */
export const FAKE_CLOUD = process.env.NEXT_PUBLIC_FAKE_CLOUD === "1";

/**
 * A dev server pointed at the real database reads it but doesn't write to it.
 *
 * Two things go wrong when it does. Dev edits — half-finished data migrations,
 * fixtures, an effect rename mid-flight — land in live accounts. And the tab
 * joins the sync loop: it holds a listener on the account store and pushes
 * whatever its build normalizes to, so a dev tab and any other tab signed into
 * the same account can spend a whole idle evening correcting each other, two
 * writes and a snapshot per round. That is a five-figure quota bill from a
 * machine nobody is sitting at.
 *
 * Reads stay on, so the page still shows the account it belongs to and the
 * community pages have something real to render. Writes are refused loudly
 * rather than silently dropped (see refuseWrite) — except the two background
 * profile touches, which have nothing to report and simply don't happen.
 *
 * NODE_ENV is the axis rather than the hostname: this is about `next dev`
 * specifically, including from a phone on the LAN. Escape hatches, in order
 * of preference: `npm run dev:fake` (the stub, no real database at all), or
 * NEXT_PUBLIC_REAL_CLOUD=1 to deliberately write for real.
 */
export const CLOUD_READONLY =
  !FAKE_CLOUD &&
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_REAL_CLOUD !== "1";

/** Stand-in for a write this build refuses to make. */
function refuseWrite<A extends unknown[], R>(name: string): (...args: A) => Promise<R> {
  return () =>
    Promise.reject(
      new Error(
        `${name}: this dev server reads the real database but does not write to it, ` +
          `so dev edits stay out of live accounts and this tab stays out of the sync ` +
          `loop. Run npm run dev:fake to use the stub backend, or set ` +
          `NEXT_PUBLIC_REAL_CLOUD=1 to write for real.`,
      ),
    );
}

/** Stand-in for a background write with nothing to report. */
const skipWrite = () => Promise.resolve();

// Auth
export const useAuth = FAKE_CLOUD ? fake.useAuth : realAuth.useAuth;
export const signInWithGoogle = FAKE_CLOUD ? fake.signInWithGoogle : realAuth.signInWithGoogle;
export const signOutUser = FAKE_CLOUD ? fake.signOutUser : realAuth.signOutUser;

// Profiles + the account's build store
export const listProfiles = FAKE_CLOUD ? fake.listProfiles : realSync.listProfiles;
export const pullCloudStore = FAKE_CLOUD ? fake.pullCloudStore : realSync.pullCloudStore;
export const pushCloudStore: typeof realSync.pushCloudStore = CLOUD_READONLY
  ? refuseWrite("pushCloudStore")
  : FAKE_CLOUD
    ? fake.pushCloudStore
    : realSync.pushCloudStore;
export const upsertProfile: typeof realSync.upsertProfile = CLOUD_READONLY
  ? skipWrite
  : FAKE_CLOUD
    ? fake.upsertProfile
    : realSync.upsertProfile;
export const ensureProfileName: typeof realSync.ensureProfileName = CLOUD_READONLY
  ? skipWrite
  : FAKE_CLOUD
    ? fake.ensureProfileName
    : realSync.ensureProfileName;
export const getProfileName = FAKE_CLOUD ? fake.getProfileName : realSync.getProfileName;
export const setProfileName: typeof realSync.setProfileName = CLOUD_READONLY
  ? refuseWrite("setProfileName")
  : FAKE_CLOUD
    ? fake.setProfileName
    : realSync.setProfileName;
export const watchCloudStore = FAKE_CLOUD ? fake.watchCloudStore : realSync.watchCloudStore;

// Published parties
export const listParties = FAKE_CLOUD ? fake.listParties : realParty.listParties;
export const fetchParty = FAKE_CLOUD ? fake.fetchParty : realParty.fetchParty;
export const publishParty: typeof realParty.publishParty = CLOUD_READONLY
  ? refuseWrite("publishParty")
  : FAKE_CLOUD
    ? fake.publishParty
    : realParty.publishParty;
export const updateSlot: typeof realParty.updateSlot = CLOUD_READONLY
  ? refuseWrite("updateSlot")
  : FAKE_CLOUD
    ? fake.updateSlot
    : realParty.updateSlot;
export const watchParty = FAKE_CLOUD ? fake.watchParty : realParty.watchParty;
export const deleteParty: typeof realParty.deleteParty = CLOUD_READONLY
  ? refuseWrite("deleteParty")
  : FAKE_CLOUD
    ? fake.deleteParty
    : realParty.deleteParty;

// Pure, shared by both backends.
export { mergeWithCloud } from "@/lib/cloudSync";
export type { UserProfile } from "@/lib/cloudSync";
export type { CloudParty, PartySummary } from "@/lib/party";
