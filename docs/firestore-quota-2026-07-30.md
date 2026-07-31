# Firestore quota spike — 2026-07-30

Handoff for a deeper look. Written the evening it was noticed; the mitigations
below are already in `main`'s working tree, the root cause is **not confirmed**.

## What was seen

Firebase console, Billable Metrics, one day:

| Metric  | Total | No-cost limit |
| ------- | ----- | ------------- |
| Reads   | 39K   | 50K/day       |
| Writes  | 20K   | 20K/day — **hit** |
| Deletes | 0     | —             |

Two climbs, both sustained and smooth:

- **08:00 → 10:00** — reads and writes rise together to ~5.5K writes, then flat
  all afternoon.
- **18:00 → 23:00** — steep, ~14.5K writes in five hours (~48 writes/min),
  reads tracking at roughly 2:1.

The user's note: it **rose heaviest while minimal work was going on**. Nobody
was editing builds through the evening, and the live user count is nowhere near
enough to explain it.

## Why this reads as a loop, not traffic

1. **Sustained rate.** ~48 writes/min for five hours is not a person. The
   debounce in `useAccountStore` is 1500ms, and `pushCloudStore` writes two docs
   (store + profile) — so one push cycle per ~2.5–3s is exactly ~40–48
   writes/min. The graph is one push cycle firing continuously.
2. **Reads tracking writes ~2:1.** That's the signature of writes being echoed
   back to open `onSnapshot` listeners, not of people loading pages.
3. **Idle.** A loop is the only mechanism here that writes without input.
4. **Timing.** `yarn dev` (plain `next dev`, i.e. **real Firestore**) was found
   still running from **18:31** — the evening climb starts at 18:00–19:00.

## The mechanism (hypothesis)

`useAccountStore` ([src/lib/useAccountStore.ts](../src/lib/useAccountStore.ts))
runs a watcher and a debounced writer against the same doc:

- The watcher (`watchCloudStore`) receives a snapshot, merges it with local, and
  if `mergedJson !== cloudJson` it nulls `lastPushed` and bumps `remoteTick` to
  force a push.
- The push writes `users/{uid}/data/builds`, which delivers a snapshot to every
  other tab on that account, which merges, disagrees, and pushes back.

Two tabs only need to **disagree about the canonical form of the same store**
for this to never settle. And they can, because `normalizeStore`
([src/lib/builds.ts:488](../src/lib/builds.ts:488)) is deliberately not
version-stable: `gameRelicLines` rewrites every effect string through the alias
tables in `data/relicEffects.ts` + `lib/effectMatch.ts`. Those tables were being
actively edited that week (`fe639d7 fixed some missing relic effects from DoN`,
`258c9f0 deep relics naming`, plus uncommitted changes to
`deepRelics/uniqueRelics/relicEffects/effectMatch`).

So: **a localhost dev tab on new alias tables + any other tab on old ones, both
signed into the same account, correct each other forever.** One dev server left
running overnight is the whole bill.

### What was actually tested

- Same-code round trip is stable. `normalizeStore(JSON.parse(JSON.stringify(s)))`
  is a fixpoint for both seed fixtures, and `mergeWithCloud(local, cloud)` equals
  both sides — so the merge is not inherently divergent.
- **Cross-version** round trip (working tree vs `HEAD` in a scratch worktree,
  same fixture) also came back stable — for the *seed fixtures*. That is the
  weak point of the test: the fixtures may simply not contain a string whose
  alias resolution changed. **This is the first thing to redo properly.**

## Mitigations already applied

| # | Change | Where |
| - | ------ | ----- |
| 2 | **Runaway guard.** More than `PUSH_LIMIT` (12) pushes in `PUSH_WINDOW_MS` (60s) stops syncing, tears down the watcher, sets `status: "runaway"`, and `console.error`s with the likely cause. `retry()` resumes. New `RunawayBanner`. | `useAccountStore.ts`, `AccountGate.tsx`, `BuildsManager.tsx` |
| 3 | **Dev servers are read-only against real Firestore.** `CLOUD_READONLY` = not fake-cloud, `NODE_ENV !== production`, no `NEXT_PUBLIC_REAL_CLOUD=1`. Reads pass through; user-facing writes reject loudly (`refuseWrite`), background profile touches no-op. New `status: "readonly"` + `DevReadOnlyBanner`. | `cloud.ts`, `useAccountStore.ts`, `AccountGate.tsx` |
| 4 | **Profile write throttle.** `pushCloudStore(user, store, refreshProfile)`. The profile doc rides along only when the build count changed or `PROFILE_REFRESH_MS` (5 min) has passed — halving steady-state writes, since the profile only carries a user-set name, a count, and a date rendered to the day. | `cloudSync.ts`, `fakeCloud.ts`, `useAccountStore.ts` |

Escape hatches for dev: `npm run dev:fake` (stub backend, preferred), or
`NEXT_PUBLIC_REAL_CLOUD=1` to write for real deliberately.

## Open questions for tomorrow

1. **Prove or kill the cross-version hypothesis.** Take a *real* account store
   (export one from the console, not the seed fixtures) and run it through
   `normalizeStore` under `HEAD~5` … `HEAD` + working tree. Any pair that
   disagrees is a confirmed ping-pong. If none do, the loop is somewhere else
   and #2 is the only thing that will catch it.
2. **Is the merge convergent at all?** `mergeWithCloud`'s `preferLocalRelics`
   flag makes each side prefer *its own* copy of a custom relic
   ([cloudSync.ts:202](../src/lib/cloudSync.ts:202)). Two tabs that both hold
   unpushed edits to the same relic id therefore both refuse the other's — a
   loop that needs no version skew at all. Worth a property test: for random
   pairs, does `merge(a, merge(b, a))` reach a fixpoint?
3. **The morning climb (08:00–10:00) is unexplained.** It predates the evening
   dev server. Same cause from a different machine, or something else?
4. **Reads were never addressed.** `listProfiles` and `listParties` are
   unbounded `getDocs` over whole collections on every mount of
   `CommunityUsers`, `PartiesDirectory`, and `PartyBuildPicker` — N reads per
   visit, and React StrictMode double-mounts in dev. Wants `limit()` +
   `orderBy(updatedAt)`, or a short-lived session cache. This scales with user
   count, so it will matter on its own eventually.
5. **Should the guard live lower down?** `PUSH_LIMIT` only covers the build
   store. `publishParty` / `updateSlot` have no equivalent, and `updateSlot`
   runs a transaction (read + write) per call.

## How to confirm it's fixed

There is no per-client attribution in the console, so the guard is the
instrument: if `status: "runaway"` ever trips in a real session, the
`console.error` names the account and the cause is reproducible from there.
Watch the daily write count for a few days with dev servers read-only — if it
drops to something proportional to real users, the diagnosis was right.
