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
// ─────────────────────────────────────────────────────────────────────────

import * as realSync from "@/lib/cloudSync";
import * as realAuth from "@/lib/useAuth";
import * as realParty from "@/lib/party";
import * as fake from "@/lib/fakeCloud";

/** True when this build talks to the stub instead of Firebase. */
export const FAKE_CLOUD = process.env.NEXT_PUBLIC_FAKE_CLOUD === "1";

// Auth
export const useAuth = FAKE_CLOUD ? fake.useAuth : realAuth.useAuth;
export const signInWithGoogle = FAKE_CLOUD ? fake.signInWithGoogle : realAuth.signInWithGoogle;
export const signOutUser = FAKE_CLOUD ? fake.signOutUser : realAuth.signOutUser;

// Profiles + the account's build store
export const listProfiles = FAKE_CLOUD ? fake.listProfiles : realSync.listProfiles;
export const pullCloudStore = FAKE_CLOUD ? fake.pullCloudStore : realSync.pullCloudStore;
export const pushCloudStore = FAKE_CLOUD ? fake.pushCloudStore : realSync.pushCloudStore;
export const upsertProfile = FAKE_CLOUD ? fake.upsertProfile : realSync.upsertProfile;
export const ensureProfileName = FAKE_CLOUD ? fake.ensureProfileName : realSync.ensureProfileName;
export const getProfileName = FAKE_CLOUD ? fake.getProfileName : realSync.getProfileName;
export const setProfileName = FAKE_CLOUD ? fake.setProfileName : realSync.setProfileName;
export const watchCloudStore = FAKE_CLOUD ? fake.watchCloudStore : realSync.watchCloudStore;

// Published parties
export const listParties = FAKE_CLOUD ? fake.listParties : realParty.listParties;
export const fetchParty = FAKE_CLOUD ? fake.fetchParty : realParty.fetchParty;
export const publishParty = FAKE_CLOUD ? fake.publishParty : realParty.publishParty;
export const deleteParty = FAKE_CLOUD ? fake.deleteParty : realParty.deleteParty;

// Pure, shared by both backends.
export { mergeWithCloud } from "@/lib/cloudSync";
export type { UserProfile } from "@/lib/cloudSync";
export type { CloudParty, PartySummary } from "@/lib/party";
