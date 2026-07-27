"use client";

// ─────────────────────────────────────────────────────────────────────────
//  The nickname you appear as across the site, with an inline editor.
//  Shown wherever your public identity is relevant: the community
//  directory (which already has the name from its listing) and your own
//  Builds page (which fetches just your profile — see MyNickname).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getProfileName, setProfileName } from "@/lib/cloudSync";
import { useAuth } from "@/lib/useAuth";

/**
 * Controlled card: the caller owns the name so its own copy (a directory
 * listing, say) stays in step with a save.
 */
export function NicknameCard({
  uid,
  name,
  onSaved,
}: {
  uid: string;
  name: string;
  onSaved: (name: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const next = draft?.trim();
    if (!next || next === name) {
      setDraft(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setProfileName(uid, next);
      onSaved(next);
      setDraft(null);
    } catch (err) {
      console.error("Saving name failed:", err);
      // Keep the editor open with the draft intact so the retry is just
      // pressing Save again.
      setError("Couldn't save your name — try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="frame mb-5 flex flex-wrap items-center gap-2 rounded-md bg-night-850 px-4 py-3">
      {draft === null ? (
        <>
          <p className="font-body text-sm text-parchment-muted">
            You appear here as <span className="font-semibold text-parchment">{name}</span>.
          </p>
          <button
            type="button"
            onClick={() => setDraft(name)}
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
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") setDraft(null);
            }}
            maxLength={40}
            autoFocus
            className="frame w-48 rounded-md border border-night-600 bg-night-900 px-2 py-1 font-body text-sm text-parchment focus:border-gold-dim focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !draft.trim()}
            className="frame rounded-md bg-night-700 px-3 py-1 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="frame rounded-md bg-night-800 px-3 py-1 font-body text-sm text-parchment-muted hover:text-parchment"
          >
            Cancel
          </button>
          {error && (
            <span className="basis-full font-body text-xs text-red-200" role="alert">
              {error}
            </span>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Self-loading variant for pages that don't already hold the profile.
 * Renders nothing until there's a name to show — signed out, or before the
 * first sync has given a new account its handle.
 *
 * `synced` re-reads the profile once the sign-in sync has run, since that's
 * what creates the name (ensureProfileName) for a first-time account.
 */
export function MyNickname({ synced }: { synced: boolean }) {
  const user = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setName(null);
      return;
    }
    let cancelled = false;
    getProfileName(user.uid)
      .then((n) => !cancelled && n && setName(n))
      .catch((err) => console.error("Loading your profile name failed:", err));
    return () => {
      cancelled = true;
    };
  }, [user, synced]);

  if (!user || !name) return null;
  return <NicknameCard uid={user.uid} name={name} onSaved={setName} />;
}
