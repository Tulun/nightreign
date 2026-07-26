"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Community directory: everyone who has signed in and synced, and a
//  read-only view of any user's builds. Signed-in users only — the
//  Firestore rules deny reads to anonymous visitors anyway.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { BuildCard } from "@/components/builds/BuildCard";
import { listProfiles, pullCloudStore, type UserProfile } from "@/lib/cloudSync";
import { signInWithGoogle, useAuth } from "@/lib/useAuth";
import { EMPTY_STORE, type BuildStore } from "@/lib/builds";

function Avatar({ profile, size }: { profile: UserProfile; size: number }) {
  return (
    <span
      className="frame grid shrink-0 place-items-center overflow-hidden rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      {profile.photoURL ? (
        // Google avatars 403 without no-referrer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold text-gold">{profile.displayName.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

export function CommunityUsers() {
  const user = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  // The selected user's synced store; their builds resolve against it.
  const [selectedStore, setSelectedStore] = useState<BuildStore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listProfiles()
      .then((p) => !cancelled && setProfiles(p))
      .catch((err) => {
        console.error("Loading user directory failed:", err);
        if (!cancelled) setError("Couldn't load the user directory — try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !selected) return;
    let cancelled = false;
    setSelectedStore(null);
    pullCloudStore(selected.uid)
      .then((s) => !cancelled && setSelectedStore(s ?? EMPTY_STORE))
      .catch((err) => {
        console.error("Loading user's builds failed:", err);
        if (!cancelled) setError("Couldn't load this user's builds — try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, selected]);

  if (user === undefined) {
    return <p className="font-body text-sm text-parchment-faint">Checking sign-in…</p>;
  }

  if (user === null) {
    return (
      <section className="frame rounded-md bg-night-850 p-5">
        <p className="font-body text-sm text-parchment-muted">
          The community directory is visible to signed-in users only.
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="frame mt-3 rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
        >
          Sign in with Google
        </button>
      </section>
    );
  }

  if (error) {
    return <p className="font-body text-sm text-red-200">{error}</p>;
  }

  // ── Profile view: one user's builds, read-only ─────────────────────────
  if (selected) {
    const builds = selectedStore?.builds
      .filter((b) => !b.shared)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setSelectedStore(null);
          }}
          className="frame mb-5 rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          ← All users
        </button>
        <div className="mb-5 flex items-center gap-3">
          <Avatar profile={selected} size={44} />
          <div>
            <h3 className="font-display text-xl font-semibold text-parchment">{selected.displayName}</h3>
            <p className="font-body text-xs text-parchment-faint">
              {selected.uid === user.uid ? "This is you. " : ""}
              Builds are view-only — ask for a share link to keep one.
            </p>
          </div>
        </div>
        {!builds ? (
          <p className="font-body text-sm text-parchment-faint">Loading builds…</p>
        ) : builds.length === 0 ? (
          <p className="font-body text-sm text-parchment-faint">No synced builds yet.</p>
        ) : (
          <div className="grid gap-3">
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} store={selectedStore!} expandable />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Directory list ─────────────────────────────────────────────────────
  if (!profiles) {
    return <p className="font-body text-sm text-parchment-faint">Loading users…</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profiles.map((p) => (
        <button
          key={p.uid}
          type="button"
          onClick={() => setSelected(p)}
          className="frame flex items-center gap-3 rounded-md bg-night-800 p-4 text-left transition-colors hover:bg-night-700"
        >
          <Avatar profile={p} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-display font-semibold text-parchment">
              {p.displayName}
              {p.uid === user.uid && (
                <span className="ml-1.5 font-body text-xs font-normal text-gold-dim">you</span>
              )}
            </span>
            <span className="block font-body text-xs text-parchment-faint">
              {p.buildCount} {p.buildCount === 1 ? "build" : "builds"}
              {p.updatedAt !== null && ` · synced ${new Date(p.updatedAt).toLocaleDateString()}`}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
