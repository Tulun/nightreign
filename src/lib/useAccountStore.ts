"use client";

// ─────────────────────────────────────────────────────────────────────────
//  THE SIGNED-IN ACCOUNT'S BUILD STORE
// ─────────────────────────────────────────────────────────────────────────
//  Builds and relics belong to an account: the Firestore copy is the source
//  of truth, and this hook owns the in-memory one the Builds page edits.
//
//    • signed out — there is no store at all, and the page says so. Nothing
//      is kept for an anonymous visitor, so nothing can drift out of step
//      with an account or follow the wrong one into a sign-in.
//    • signing in  — pull the account copy, reconcile it with this browser's
//      cache (below), push the result back.
//    • afterwards  — debounce-push every change, and merge in every change
//      the account's other devices push, live.
//
//  The localStorage cache is a backup, one key per uid. It is written on
//  every change and read in exactly two situations: when the database can't
//  be reached, so the page can still show the last known copy instead of
//  nothing; and at sign-in, where it covers edits made in the second or two
//  before a tab closed mid-debounce. It never seeds a *different* account,
//  and edits made against it while offline stay local until a pull succeeds.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ensureProfileName,
  mergeWithCloud,
  pullCloudStore,
  pushCloudStore,
  upsertProfile,
  useAuth,
  watchCloudStore,
} from "@/lib/cloud";
import { CloudReadError } from "@/lib/cloudRead";
import {
  EMPTY_STORE,
  cacheStore,
  clearLegacyStore,
  loadCachedStore,
  loadLegacyStore,
  mergeStores,
  type BuildStore,
} from "@/lib/builds";

export type StoreStatus =
  /** Auth state still restoring, or the account copy still loading. */
  | "loading"
  /** Nobody signed in — there is no store. */
  | "signed-out"
  /** Loaded, with changes on their way to the account. */
  | "syncing"
  /** Loaded, and the account copy matches. */
  | "synced"
  /** Database unreachable; showing this browser's cached copy. */
  | "offline"
  /** Database unreachable and no cached copy to fall back on. */
  | "error";

export interface AccountStore {
  /** The store to render and edit, or null when there isn't one yet. */
  store: BuildStore | null;
  /** Edit it. Writes reach the account (and the cache) on their own. */
  setStore: Dispatch<SetStateAction<BuildStore | null>>;
  status: StoreStatus;
  /** Why the account copy couldn't be read, for the offline/error states. */
  error: unknown;
  /** Try the account copy again after a failed load. */
  retry: () => void;
  /** True when a cache write failed — no offline backup until it works. */
  cacheBroken: boolean;
  /**
   * Builds this browser saved before the page required an account, waiting
   * on an answer (see loadLegacyStore). Null when there are none.
   */
  legacy: BuildStore | null;
  /** Merge the legacy store into the account, and stop asking. */
  importLegacy: () => void;
  /** Leave it where it is, and stop asking. */
  dismissLegacy: () => void;
}

/**
 * Canonical text for comparing two stores. A cloud copy comes back through
 * JSON and normalizeStore, which can hand the same data back with its keys in
 * a different order than the object we sent — plain JSON.stringify would read
 * that as a change and bounce a write back and forth forever. Sorting keys at
 * every level makes the comparison about content only.
 */
function storeKey(store: BuildStore | null): string | null {
  if (!store) return null;
  return JSON.stringify(store, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  );
}

export function useAccountStore(): AccountStore {
  const user = useAuth();
  const uid = user?.uid ?? null;
  const [store, setStore] = useState<BuildStore | null>(null);
  const [status, setStatus] = useState<StoreStatus>("loading");
  const [error, setError] = useState<unknown>(null);
  const [cacheBroken, setCacheBroken] = useState(false);
  const [legacy, setLegacy] = useState<BuildStore | null>(null);
  /** uid whose account copy has loaded — pushes and the live listener only
   *  start after it. State, so both of those effects re-run when it lands. */
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  /** Bumped by retry() to re-run the load after a failure. */
  const [attempt, setAttempt] = useState(0);
  /** Canonical form (storeKey) of the last store known to match the account. */
  const lastPushed = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Latest store, readable from the listener without resubscribing on edits. */
  const storeRef = useRef<BuildStore | null>(store);
  /** Bumped by the listener to make the push effect re-run and reconcile. */
  const [remoteTick, setRemoteTick] = useState(0);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Sign-out drops the store entirely: what's on screen belonged to the
  // account that just left, and nothing here is anonymous-editable.
  useEffect(() => {
    if (user !== null) return;
    setStore(null);
    setLoadedUid(null);
    setLegacy(null);
    setError(null);
    lastPushed.current = null;
    setStatus("signed-out");
  }, [user]);

  // Load the account copy, once per uid (and again on retry).
  useEffect(() => {
    if (!user || loadedUid === user.uid) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        // Give first-time accounts a directory name (never overwrites a
        // chosen nickname); runs alongside the store pull.
        const [cloud] = await Promise.all([pullCloudStore(user.uid), ensureProfileName(user)]);
        if (cancelled) return;
        // The cache can only be ahead of the account copy by a debounce
        // window (or by edits made while the database was down), so the
        // account copy wins ties — see mergeWithCloud.
        const cached = loadCachedStore(user.uid);
        const merged = cached && cloud ? mergeWithCloud(cached, cloud) : (cloud ?? cached ?? EMPTY_STORE);
        const mergedJson = storeKey(merged);
        if (cloud && storeKey(cloud) === mergedJson) {
          // Account copy already matches — just refresh the directory profile.
          await upsertProfile(user, merged);
        } else {
          await pushCloudStore(user, merged);
        }
        if (cancelled) return;
        lastPushed.current = mergedJson;
        setLoadedUid(user.uid);
        setStore(merged);
        setStatus("synced");
        setLegacy(loadLegacyStore());
      } catch (err) {
        if (cancelled) return;
        console.error("Loading the account's builds failed:", err);
        setError(err);
        // A read that couldn't reach the database is the case the cache
        // exists for; anything else (a rejected write, a bug) is not, since
        // showing an editable copy we can't save would only lose the edits.
        const cached = err instanceof CloudReadError ? loadCachedStore(user.uid) : null;
        setStore(cached);
        setStatus(cached ? "offline" : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadedUid, attempt]);

  const retry = useCallback(() => {
    setLoadedUid(null);
    lastPushed.current = null;
    setAttempt((n) => n + 1);
  }, []);

  // Back the store up locally on every change, under the account it belongs
  // to. Offline edits live here until a pull succeeds and merges them up.
  useEffect(() => {
    if (!uid || !store) return;
    setCacheBroken(!cacheStore(uid, store));
  }, [uid, store]);

  // Live updates from the account's other devices. Anything they add is
  // merged into this tab's store as it arrives, so a second device can't go
  // stale — and this tab's next push can't overwrite what it never saw.
  useEffect(() => {
    if (!user || loadedUid !== user.uid) return;
    return watchCloudStore(user.uid, (cloud) => {
      const local = storeRef.current;
      const localJson = storeKey(local);
      const cloudJson = storeKey(cloud);
      if (cloudJson === lastPushed.current) return; // the echo of our own write
      // Unpushed local edits outrank a snapshot that predates them.
      const merged = local ? mergeWithCloud(local, cloud, localJson !== lastPushed.current) : cloud;
      const mergedJson = storeKey(merged);
      if (mergedJson === cloudJson) {
        lastPushed.current = mergedJson; // the account already holds everything
      } else {
        lastPushed.current = null; // it's missing local data — push it back
        setRemoteTick((n) => n + 1);
      }
      if (mergedJson !== localJson) setStore(merged);
    });
  }, [user, loadedUid]);

  // Debounced write-through for every change after the load. A push lost to
  // closing the tab mid-debounce is only deferred: the cache has the change,
  // and the next sign-in reconciles it.
  useEffect(() => {
    if (!user || !store || loadedUid !== user.uid) return;
    const json = storeKey(store);
    if (json === lastPushed.current) return;
    setStatus("syncing");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushCloudStore(user, store)
        .then(() => {
          lastPushed.current = json;
          setStatus("synced");
        })
        .catch((err) => {
          console.error("Saving to your account failed:", err);
          setError(err);
          setStatus("offline");
        });
    }, 1500);
    return () => clearTimeout(timer.current);
    // remoteTick: a listener update that left the account copy short of local
    // data needs this to re-run even though `store` itself didn't change.
  }, [user, store, loadedUid, remoteTick]);

  const importLegacy = useCallback(() => {
    setStore((s) => (legacy ? mergeStores(s ?? EMPTY_STORE, legacy) : s));
    clearLegacyStore(true);
    setLegacy(null);
  }, [legacy]);

  const dismissLegacy = useCallback(() => {
    clearLegacyStore();
    setLegacy(null);
  }, []);

  return {
    store,
    setStore,
    status,
    error,
    retry,
    cacheBroken,
    legacy,
    importLegacy,
    dismissLegacy,
  };
}
