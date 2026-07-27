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
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { cloudRead } from "@/lib/cloudRead";
import {
  applyTombstones,
  mergeTombstones,
  normalizeStore,
  sortedTags,
  type BuildStore,
} from "@/lib/builds";

/** Directory entry for the community users page. */
export interface UserProfile {
  uid: string;
  displayName: string;
  buildCount: number;
  /** Last sync, ms epoch — null for a profile that has never synced. */
  updatedAt: number | null;
}

const profileDoc = (uid: string) => doc(db, "users", uid);
const storeDoc = (uid: string) => doc(db, "users", uid, "data", "builds");

/**
 * Refresh the directory profile's counts. Deliberately publishes nothing
 * from the Google account — no name, no photo, no email. The site-visible
 * name is user-owned (see ensureProfileName / setProfileName), so a
 * nickname chosen for privacy can never be clobbered by a sync; the
 * deleteField scrubs any photo an older version of this code published.
 */
export async function upsertProfile(user: User, store: BuildStore): Promise<void> {
  await setDoc(
    profileDoc(user.uid),
    {
      photoURL: deleteField(),
      buildCount: store.builds.length,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Neutral default handle — the profile is anonymous until a nickname is set. */
const defaultHandle = (uid: string) => `Nightfarer-${uid.slice(0, 4)}`;

/**
 * Make sure the profile has a site-visible name that is NOT the real one.
 * A missing name gets the neutral handle — never the Google account name,
 * so the real identity stays out of Firestore even as a default. A name
 * matching the Google account name (published by an older version of the
 * sync) is treated as a leak and reset the same way; the side effect is
 * that a nickname deliberately identical to the account name won't stick,
 * which is the right trade for a directory that may end up public.
 */
export async function ensureProfileName(user: User): Promise<void> {
  const snap = await getDoc(profileDoc(user.uid));
  const existing = snap.data()?.displayName;
  const googleName = (user.displayName ?? "").trim();
  const leaked =
    typeof existing === "string" && !!googleName && existing.trim() === googleName;
  if (typeof existing === "string" && existing.trim() && !leaked) return;
  await setDoc(profileDoc(user.uid), { displayName: defaultHandle(user.uid) }, { merge: true });
}

/**
 * The site-visible name on one profile, or null when it has none yet (a
 * brand-new account, before the sign-in sync runs ensureProfileName).
 */
export async function getProfileName(uid: string): Promise<string | null> {
  const snap = await cloudRead(() => getDoc(profileDoc(uid)));
  const name = snap.data()?.displayName;
  return typeof name === "string" && name.trim() ? name : null;
}

/** Set the site-visible name (nickname) shown in the directory. */
export async function setProfileName(uid: string, name: string): Promise<void> {
  await setDoc(profileDoc(uid), { displayName: name.trim() }, { merge: true });
}

/** Write the store (and a matching profile refresh) to the account. */
export async function pushCloudStore(user: User, store: BuildStore): Promise<void> {
  await Promise.all([
    upsertProfile(user, store),
    setDoc(storeDoc(user.uid), { store: JSON.stringify(store), updatedAt: serverTimestamp() }),
  ]);
}

/**
 * Read an account's store; null when absent or unparseable. Throws
 * CloudReadError when the backend can't be reached (see cloudRead).
 */
export async function pullCloudStore(uid: string): Promise<BuildStore | null> {
  const snap = await cloudRead(() => getDoc(storeDoc(uid)));
  const raw = snap.data()?.store;
  if (typeof raw !== "string") return null;
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Watch an account's store for writes from its *other* devices, calling
 * `onChange` with each new copy. Without this a tab only ever reads the cloud
 * once, at sign-in: a relic added on a phone stays invisible on a laptop
 * that's already open, and the laptop's next debounced push overwrites it.
 *
 * Our own writes are filtered out: the local echo (hasPendingWrites) is
 * skipped outright, and the server acknowledgement of the same content is
 * recognized by the caller comparing it to what it last pushed.
 *
 * Returns the unsubscribe function. A listener failure (rules, offline) is
 * logged and ends the subscription — the sign-in merge remains the fallback.
 */
export function watchCloudStore(uid: string, onChange: (store: BuildStore) => void): () => void {
  return onSnapshot(
    storeDoc(uid),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const raw = snap.data()?.store;
      if (typeof raw !== "string") return;
      try {
        const parsed = normalizeStore(JSON.parse(raw));
        if (parsed) onChange(parsed);
      } catch {
        // An unparseable cloud copy is nothing this tab can act on.
      }
    },
    (err) => console.error("Cloud watch failed:", err),
  );
}

/** Every signed-up account, most recently synced first. */
export async function listProfiles(): Promise<UserProfile[]> {
  const snap = await cloudRead(() => getDocs(collection(db, "users")));
  return snap.docs
    .map((d) => {
      const data = d.data() as {
        displayName?: string;
        buildCount?: number;
        updatedAt?: Timestamp;
      };
      return {
        uid: d.id,
        displayName: data.displayName ?? defaultHandle(d.id),
        buildCount: data.buildCount ?? 0,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
      };
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * Merge of the device's store with the account's cloud copy — at sign-in, and
 * again for every live update from another device. Builds clash by id and the
 * newer updatedAt wins (edits from another device beat a stale local copy, and
 * vice versa). Custom relics carry no timestamp, so on an id clash the cloud
 * copy wins — matching mergeStores' imported-wins rule.
 *
 * `preferLocalRelics` flips that tie-break for the live path when this device
 * has edits it hasn't pushed yet: a relic being edited here must not be reset
 * by a snapshot that predates the edit.
 *
 * The union is then cut back by both sides' tombstones — otherwise whichever
 * device still holds a deleted build or relic hands it straight back.
 */
export function mergeWithCloud(
  local: BuildStore,
  cloud: BuildStore,
  preferLocalRelics = false,
): BuildStore {
  const builds = new Map(local.builds.map((b) => [b.id, b]));
  for (const b of cloud.builds) {
    const l = builds.get(b.id);
    if (!l || b.updatedAt >= l.updatedAt) builds.set(b.id, b);
  }
  const relics = new Map(local.customRelics.map((r) => [r.id, r]));
  for (const r of cloud.customRelics) {
    if (!preferLocalRelics || !relics.has(r.id)) relics.set(r.id, r);
  }
  return applyTombstones({
    version: 3,
    builds: Array.from(builds.values()),
    customRelics: Array.from(relics.values()),
    tags: sortedTags([...local.tags, ...cloud.tags]),
    deleted: mergeTombstones(local.deleted, cloud.deleted),
  });
}
