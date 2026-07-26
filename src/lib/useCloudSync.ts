"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Keeps a BuildStore mirrored to the signed-in account. localStorage keeps
//  working exactly as before (the caller still persists every change); this
//  hook only adds the cloud on top:
//    • on sign-in, pull the account copy, merge, hand the result back
//    • afterwards, debounce-push every change
//  Signed out, it does nothing and reports "local".
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAuth } from "@/lib/useAuth";
import {
  ensureProfileName,
  mergeWithCloud,
  pullCloudStore,
  pushCloudStore,
  upsertProfile,
} from "@/lib/cloudSync";
import type { BuildStore } from "@/lib/builds";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

export function useCloudSync(
  store: BuildStore | null,
  setStore: Dispatch<SetStateAction<BuildStore | null>>,
): SyncStatus {
  const user = useAuth();
  const [status, setStatus] = useState<SyncStatus>("local");
  /** uid whose sign-in merge has completed — pushes only run after it. */
  const syncedUid = useRef<string | null>(null);
  /** Serialized form of the last store known to match the cloud. */
  const lastPushed = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sign-out: back to local-only. The store stays as-is (and in localStorage).
  useEffect(() => {
    if (user === null) {
      syncedUid.current = null;
      lastPushed.current = null;
      setStatus("local");
    }
  }, [user]);

  // Sign-in merge, once per uid, as soon as the local store has loaded.
  useEffect(() => {
    if (!user || !store || syncedUid.current === user.uid) return;
    let cancelled = false;
    setStatus("syncing");
    (async () => {
      try {
        // Give first-time accounts a directory name (never overwrites a
        // chosen nickname); runs alongside the store pull.
        const [cloud] = await Promise.all([pullCloudStore(user.uid), ensureProfileName(user)]);
        if (cancelled) return; // superseded by a newer local edit or sign-out
        const merged = cloud ? mergeWithCloud(store, cloud) : store;
        const mergedJson = JSON.stringify(merged);
        syncedUid.current = user.uid;
        if (cloud && JSON.stringify(cloud) === mergedJson) {
          // Cloud already matches — just refresh the directory profile.
          await upsertProfile(user, merged);
        } else {
          await pushCloudStore(user, merged);
        }
        if (cancelled) return;
        lastPushed.current = mergedJson;
        setStore(merged);
        setStatus("synced");
      } catch (err) {
        console.error("Cloud sync failed:", err);
        if (!cancelled) {
          syncedUid.current = null; // next store change retries the merge
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, store, setStore]);

  // Debounced write-through for every change after the merge. A push lost to
  // closing the tab mid-debounce is only deferred: localStorage has the
  // change, and the next sign-in merge sends it.
  useEffect(() => {
    if (!user || !store || syncedUid.current !== user.uid) return;
    const json = JSON.stringify(store);
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
  }, [user, store]);

  return status;
}
