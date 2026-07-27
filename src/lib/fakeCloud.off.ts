// ─────────────────────────────────────────────────────────────────────────
//  Empty stand-in swapped in for lib/fakeCloud in any build that isn't
//  running the dev stub (see next.config.mjs). Without the swap webpack
//  bundles the stub and its fixture accounts for real visitors — inert, but
//  pointless weight.
//
//  It names every export lib/cloud.ts and components/DevSeed.tsx read off the
//  module, all undefined. Such a build only ever *reads* them — FAKE_CLOUD is
//  false, so no branch calls them — and naming them keeps the build free of
//  "not exported" warnings.
// ─────────────────────────────────────────────────────────────────────────

const off = undefined as never;

export {
  off as useAuth,
  off as signInWithGoogle,
  off as signOutUser,
  off as listProfiles,
  off as pullCloudStore,
  off as pushCloudStore,
  off as upsertProfile,
  off as ensureProfileName,
  off as getProfileName,
  off as setProfileName,
  off as watchCloudStore,
  off as listParties,
  off as fetchParty,
  off as publishParty,
  off as deleteParty,
  off as signedInUid,
  off as resetFakeCloud,
  off as setScenario,
  off as remoteEdit,
};
