"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Community directory: everyone who has signed in and synced, and a
//  read-only view of any user's builds. Signed-in users only — the
//  Firestore rules deny reads to anonymous visitors anyway.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { BuildCard } from "@/components/builds/BuildCard";
import { listProfiles, pullCloudStore, setProfileName, type UserProfile } from "@/lib/cloudSync";
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
  // Inline editor for your own directory name (nickname).
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

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

  const me = profiles.find((p) => p.uid === user.uid);
  const saveName = async () => {
    const name = nameDraft?.trim();
    if (!name || !me || name === me.displayName) {
      setNameDraft(null);
      return;
    }
    setSavingName(true);
    try {
      await setProfileName(user.uid, name);
      setProfiles((ps) => ps?.map((p) => (p.uid === user.uid ? { ...p, displayName: name } : p)) ?? ps);
      setNameDraft(null);
    } catch (err) {
      console.error("Saving name failed:", err);
      setError("Couldn't save your name — try again in a moment.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div>
      {/* Your public identity — swap the Google name for a nickname any time. */}
      {me && (
        <section className="frame mb-5 flex flex-wrap items-center gap-2 rounded-md bg-night-850 px-4 py-3">
          {nameDraft === null ? (
            <>
              <p className="font-body text-sm text-parchment-muted">
                You appear here as <span className="font-semibold text-parchment">{me.displayName}</span>.
              </p>
              <button
                type="button"
                onClick={() => setNameDraft(me.displayName)}
                className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
              >
                Change name
              </button>
              <span className="basis-full font-body text-xs text-parchment-faint">
                Pick a nickname if you&rsquo;d rather not show your real name — it replaces it
                everywhere on the site.
              </span>
            </>
          ) : (
            <>
              <label htmlFor="nickname" className="font-body text-sm text-parchment-muted">
                Shown as
              </label>
              <input
                id="nickname"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveName();
                  if (e.key === "Escape") setNameDraft(null);
                }}
                maxLength={40}
                autoFocus
                className="frame w-48 rounded-md border border-night-600 bg-night-900 px-2 py-1 font-body text-sm text-parchment focus:border-gold-dim focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={savingName || !nameDraft.trim()}
                className="frame rounded-md bg-night-700 px-3 py-1 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-50"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setNameDraft(null)}
                className="frame rounded-md bg-night-800 px-3 py-1 font-body text-sm text-parchment-muted hover:text-parchment"
              >
                Cancel
              </button>
            </>
          )}
        </section>
      )}

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
    </div>
  );
}
