// ─────────────────────────────────────────────────────────────────────────
//  Cloud copies of the build store, one per signed-in account:
//    users/{uid}              — profile doc (directory listing: name, photo,
//                               build count, last update)
//    users/{uid}/data/builds  — the whole BuildStore as a JSON string
//
//  The store travels as JSON text rather than expanded Firestore fields:
//  normalizeStore already handles versioning/migration on the way back in,
//  undefined-valued optionals drop out cleanly, and a string field can't
//  trip over Firestore's nested-array limits. localStorage stays the source
//  of truth for the current device; the cloud doc is a synced mirror.
// ─────────────────────────────────────────────────────────────────────────

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { normalizeStore, sortedTags, type BuildStore } from "@/lib/builds";

/** Directory entry for the community users page. */
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  buildCount: number;
  /** Last sync, ms epoch — null for a profile that has never synced. */
  updatedAt: number | null;
}

const profileDoc = (uid: string) => doc(db, "users", uid);
const storeDoc = (uid: string) => doc(db, "users", uid, "data", "builds");

/** Create/refresh the directory profile (name, photo, build count). */
export async function upsertProfile(user: User, store: BuildStore): Promise<void> {
  await setDoc(
    profileDoc(user.uid),
    {
      displayName: user.displayName ?? user.email ?? "Nightfarer",
      photoURL: user.photoURL ?? null,
      // Shared (view-only) imports are someone else's work — not counted.
      buildCount: store.builds.filter((b) => !b.shared).length,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Write the store (and a matching profile refresh) to the account. */
export async function pushCloudStore(user: User, store: BuildStore): Promise<void> {
  await Promise.all([
    upsertProfile(user, store),
    setDoc(storeDoc(user.uid), { store: JSON.stringify(store), updatedAt: serverTimestamp() }),
  ]);
}

/** Read an account's store; null when absent or unparseable. */
export async function pullCloudStore(uid: string): Promise<BuildStore | null> {
  const snap = await getDoc(storeDoc(uid));
  const raw = snap.data()?.store;
  if (typeof raw !== "string") return null;
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Every signed-up account, most recently synced first. */
export async function listProfiles(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => {
      const data = d.data() as {
        displayName?: string;
        photoURL?: string | null;
        buildCount?: number;
        updatedAt?: Timestamp;
      };
      return {
        uid: d.id,
        displayName: data.displayName ?? "Nightfarer",
        photoURL: data.photoURL ?? null,
        buildCount: data.buildCount ?? 0,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
      };
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * Sign-in merge of the device's store with the account's cloud copy. Builds
 * clash by id and the newer updatedAt wins (edits from another device beat a
 * stale local copy, and vice versa). Custom relics carry no timestamp, so on
 * an id clash the cloud copy wins — matching mergeStores' imported-wins rule.
 */
export function mergeWithCloud(local: BuildStore, cloud: BuildStore): BuildStore {
  const builds = new Map(local.builds.map((b) => [b.id, b]));
  for (const b of cloud.builds) {
    const l = builds.get(b.id);
    if (!l || b.updatedAt >= l.updatedAt) builds.set(b.id, b);
  }
  const relics = new Map(local.customRelics.map((r) => [r.id, r]));
  for (const r of cloud.customRelics) relics.set(r.id, r);
  return {
    version: 3,
    builds: Array.from(builds.values()),
    customRelics: Array.from(relics.values()),
    tags: sortedTags([...local.tags, ...cloud.tags]),
  };
}
