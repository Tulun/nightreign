"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Keeps a BuildStore mirrored to the signed-in account. localStorage keeps
//  working exactly as before (the caller still persists every change); this
//  hook only adds the cloud on top:
//    • on sign-in, pull the account copy, merge, hand the result back
//    • afterwards, debounce-push every change
//    • and merge in every change the account's other devices push, live
//  Signed out, it does nothing and reports "local".
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
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
import type { BuildStore } from "@/lib/builds";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

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

export function useCloudSync(
  store: BuildStore | null,
  setStore: Dispatch<SetStateAction<BuildStore | null>>,
): SyncStatus {
  const user = useAuth();
  const [status, setStatus] = useState<SyncStatus>("local");
  /**
   * uid whose sign-in merge has completed — pushes and the live listener only
   * start after it. State rather than a ref so both of those effects re-run
   * the moment the merge lands.
   */
  const [syncedUid, setSyncedUid] = useState<string | null>(null);
  /** Canonical form (storeKey) of the last store known to match the cloud. */
  const lastPushed = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Latest store, readable from the listener without resubscribing on edits. */
  const storeRef = useRef<BuildStore | null>(store);
  /** Bumped by the listener to make the push effect re-run and reconcile. */
  const [remoteTick, setRemoteTick] = useState(0);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Sign-out: back to local-only. The store stays as-is (and in localStorage).
  useEffect(() => {
    if (user === null) {
      setSyncedUid(null);
      lastPushed.current = null;
      setStatus("local");
    }
  }, [user]);

  // Sign-in merge, once per uid, as soon as the local store has loaded.
  useEffect(() => {
    if (!user || !store || syncedUid === user.uid) return;
    let cancelled = false;
    setStatus("syncing");
    (async () => {
      try {
        // Give first-time accounts a directory name (never overwrites a
        // chosen nickname); runs alongside the store pull.
        const [cloud] = await Promise.all([pullCloudStore(user.uid), ensureProfileName(user)]);
        if (cancelled) return; // superseded by a newer local edit or sign-out
        const merged = cloud ? mergeWithCloud(store, cloud) : store;
        const mergedJson = storeKey(merged);
        if (cloud && storeKey(cloud) === mergedJson) {
          // Cloud already matches — just refresh the directory profile.
          await upsertProfile(user, merged);
        } else {
          await pushCloudStore(user, merged);
        }
        if (cancelled) return;
        lastPushed.current = mergedJson;
        setSyncedUid(user.uid);
        setStore(merged);
        setStatus("synced");
      } catch (err) {
        console.error("Cloud sync failed:", err);
        if (!cancelled) {
          setSyncedUid(null); // next store change retries the merge
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, store, syncedUid, setStore]);

  // Live updates from the account's other devices. Anything they add is
  // merged into this tab's store as it arrives, so a second device can't go
  // stale — and this tab's next push can't overwrite what it never saw.
  useEffect(() => {
    if (!user || syncedUid !== user.uid) return;
    return watchCloudStore(user.uid, (cloud) => {
      const local = storeRef.current;
      const localJson = storeKey(local);
      const cloudJson = storeKey(cloud);
      if (cloudJson === lastPushed.current) return; // the echo of our own write
      // Unpushed local edits outrank a snapshot that predates them.
      const merged = local ? mergeWithCloud(local, cloud, localJson !== lastPushed.current) : cloud;
      const mergedJson = storeKey(merged);
      if (mergedJson === cloudJson) {
        lastPushed.current = mergedJson; // cloud already holds everything
      } else {
        lastPushed.current = null; // cloud is missing local data — push it back
        setRemoteTick((n) => n + 1);
      }
      if (mergedJson !== localJson) setStore(merged);
    });
  }, [user, syncedUid, setStore]);

  // Debounced write-through for every change after the merge. A push lost to
  // closing the tab mid-debounce is only deferred: localStorage has the
  // change, and the next sign-in merge sends it.
  useEffect(() => {
    if (!user || !store || syncedUid !== user.uid) return;
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
          console.error("Cloud push failed:", err);
          setStatus("error");
        });
    }, 1500);
    return () => clearTimeout(timer.current);
    // remoteTick: a listener update that left the cloud short of local data
    // needs this to re-run even though `store` itself didn't change.
  }, [user, store, syncedUid, remoteTick]);

  return status;
}
