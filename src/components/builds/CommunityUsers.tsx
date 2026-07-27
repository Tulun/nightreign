"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Community directory: everyone who has signed in and synced, and a
//  read-only view of any user's public builds. Profiles are addressable as
//  /builds/users?u=<uid>, and a single build as ?u=<uid>&b=<buildId> (a
//  static export can't prerender /users/{uid}/{buildId} paths, so the ids
//  ride the query string). Both are readable without signing in — signing
//  in only adds syncing and the nickname editor.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { characterChalices } from "@/data/chalices";
import { BuildCard } from "@/components/builds/BuildCard";
import { MultiSelect } from "@/components/MultiSelect";
import { listProfiles, pullCloudStore, setProfileName, type UserProfile } from "@/lib/cloudSync";
import { useAuth } from "@/lib/useAuth";
import {
  EMPTY_STORE,
  buildPath,
  buildShareUrl,
  sortedTags,
  type Build,
  type BuildStore,
} from "@/lib/builds";

/**
 * Initial-letter tile. Deliberately not the Google photo: profiles publish
 * nothing from the real account, only the chosen nickname.
 */
function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="frame grid shrink-0 place-items-center rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      <span className="font-display font-bold text-gold">{name.charAt(0).toUpperCase()}</span>
    </span>
  );
}

/**
 * One user's public builds with browse filters: their Nightfarers (only the
 * ones they have builds for) and the tags in use on those builds. Mounted
 * with key={uid}, so filters reset when switching profiles.
 */
function ProfileBuilds({ store, uid }: { store: BuildStore; uid: string }) {
  const [characterFilter, setCharacterFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("any");

  const visible = store.builds.filter((b) => b.public !== false);
  if (visible.length === 0) {
    return <p className="font-body text-sm text-parchment-faint">No synced builds yet.</p>;
  }

  // Filter options come from the builds themselves, not the owner's tag
  // registry — only what's actually on a visible build shows here.
  const characters = characterChalices
    .map((c) => ({ name: c.name, count: visible.filter((b) => b.character === c.name).length }))
    .filter((c) => c.count > 0);
  const tags = sortedTags(visible.flatMap((b) => b.tags ?? []));
  const matchesTags = (b: Build) =>
    tagFilter.length === 0 ||
    (tagMode === "any"
      ? tagFilter.some((t) => b.tags?.includes(t))
      : tagFilter.every((t) => b.tags?.includes(t)));
  const builds = visible
    .filter((b) => characterFilter.length === 0 || characterFilter.includes(b.character))
    .filter(matchesTags);
  // One section per Nightfarer, in the roster's own order, newest build first
  // within each — easier to scan than one long mixed list.
  const groups = characters
    .map((c) => ({
      name: c.name,
      builds: builds.filter((b) => b.character === c.name).sort((a, b) => b.updatedAt - a.updatedAt),
    }))
    .filter((g) => g.builds.length > 0);

  return (
    <div>
      {(characters.length > 1 || tags.length > 0) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {characters.length > 1 && (
            <MultiSelect
              values={characterFilter}
              options={characters.map((c) => ({ value: c.name, label: `${c.name} (${c.count})` }))}
              onChange={setCharacterFilter}
              placeholder="All Nightfarers"
              className="w-52"
              showValues
            />
          )}
          {tags.length > 0 && (
            <MultiSelect
              values={tagFilter}
              options={tags.map((t) => ({ value: t, label: t }))}
              onChange={setTagFilter}
              placeholder="All tags"
              className="w-44"
              showValues
            />
          )}
          {/* Match any (OR) vs all (AND) of the selected tags. */}
          {tagFilter.length > 1 && (
            <div className="flex overflow-hidden rounded-md border border-night-600" role="group" aria-label="Tag match mode">
              {(["any", "all"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTagMode(m)}
                  aria-pressed={tagMode === m}
                  title={m === "any" ? "Builds with at least one selected tag (OR)" : "Builds with every selected tag (AND)"}
                  className={`px-2.5 py-1.5 font-body text-xs transition-colors ${
                    tagMode === m
                      ? "bg-night-700 text-gold-bright"
                      : "bg-night-900 text-parchment-muted hover:text-parchment"
                  }`}
                >
                  {m === "any" ? "Match any" : "Match all"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {groups.length === 0 ? (
        <p className="font-body text-sm text-parchment-faint">No builds match the filters.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.name}>
              <h4 className="eyebrow mb-2 border-b border-night-700 pb-1.5 text-gold-dim">
                {g.name}
                <span className="ml-2 font-body text-xs normal-case tracking-normal text-parchment-faint">
                  {g.builds.length}
                </span>
              </h4>
              {/* Cards pair up once there's room for a full relic strip
                  beside the title — below that they'd truncate the name. */}
              <div className="grid gap-3 xl:grid-cols-2">
                {g.builds.map((b) => (
                  <BuildCard key={b.id} build={b} store={store} href={buildPath(uid, b.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Copies a link to the clipboard, with a prompt fallback where it's blocked. */
function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
    >
      {copied ? "Link copied ✓" : label}
    </button>
  );
}

export function CommunityUsers() {
  const user = useAuth();
  const router = useRouter();
  // Profile and build selection live in the URL so both can be linked
  // directly: ?u=<uid> is a profile, ?u=<uid>&b=<id> a single build.
  const params = useSearchParams();
  const selectedUid = params.get("u");
  const selectedBuildId = params.get("b");
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  // The selected user's synced store; their builds resolve against it.
  const [selectedStore, setSelectedStore] = useState<BuildStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Inline editor for your own directory name (nickname).
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!selectedUid) return;
    let cancelled = false;
    setSelectedStore(null);
    pullCloudStore(selectedUid)
      .then((s) => !cancelled && setSelectedStore(s ?? EMPTY_STORE))
      .catch((err) => {
        console.error("Loading user's builds failed:", err);
        if (!cancelled) setError("Couldn't load this user's builds — try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUid]);

  if (error) {
    return <p className="font-body text-sm text-red-200">{error}</p>;
  }

  if (!profiles) {
    return <p className="font-body text-sm text-parchment-faint">Loading users…</p>;
  }

  // ── Single build view: the shareable page for one loadout ──────────────
  if (selectedUid && selectedBuildId) {
    const selected = profiles.find((p) => p.uid === selectedUid);
    const owner = selected?.displayName;
    const build = selectedStore?.builds.find(
      (b) => b.id === selectedBuildId && b.public !== false,
    );
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/builds/users?u=${encodeURIComponent(selectedUid)}`}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            ← {owner ? `${owner}’s builds` : "All builds"}
          </Link>
          {build && <CopyLinkButton url={buildShareUrl(selectedUid, selectedBuildId)} />}
        </div>
        {!selectedStore ? (
          <p className="font-body text-sm text-parchment-faint">Loading build…</p>
        ) : !build ? (
          <p className="font-body text-sm text-parchment-faint">
            No such build — the link may be stale, or it&rsquo;s no longer shared.
          </p>
        ) : (
          <>
            {selected && (
              <div className="mb-4 flex items-center gap-3">
                <Avatar name={selected.displayName} size={36} />
                <p className="font-body text-sm text-parchment-muted">
                  A build by <span className="font-semibold text-parchment">{selected.displayName}</span>
                  {selected.uid === user?.uid && " (you)"} — view-only.
                </p>
              </div>
            )}
            <BuildCard build={build} store={selectedStore} />
          </>
        )}
      </div>
    );
  }

  // ── Profile view: one user's public builds, read-only ──────────────────
  if (selectedUid) {
    const selected = profiles.find((p) => p.uid === selectedUid);
    return (
      <div>
        <button
          type="button"
          onClick={() => router.push("/builds/users")}
          className="frame mb-5 rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          ← All users
        </button>
        {!selected ? (
          <p className="font-body text-sm text-parchment-faint">
            No such user — the link may be stale, or they haven&rsquo;t synced yet.
          </p>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <Avatar name={selected.displayName} size={44} />
              <div>
                <h3 className="font-display text-xl font-semibold text-parchment">{selected.displayName}</h3>
                <p className="font-body text-xs text-parchment-faint">
                  {selected.uid === user?.uid ? "This is you. " : ""}
                  Builds are view-only — open one for its own page and a share link.
                </p>
              </div>
            </div>
            {!selectedStore ? (
              <p className="font-body text-sm text-parchment-faint">Loading builds…</p>
            ) : (
              <ProfileBuilds key={selectedUid} store={selectedStore} uid={selectedUid} />
            )}
          </>
        )}
      </div>
    );
  }

  // ── Directory list ─────────────────────────────────────────────────────
  const me = user ? profiles.find((p) => p.uid === user.uid) : undefined;
  const saveName = async () => {
    const name = nameDraft?.trim();
    if (!user || !name || name === me?.displayName) {
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
            onClick={() => router.push(`/builds/users?u=${encodeURIComponent(p.uid)}`)}
            className="frame flex items-center gap-3 rounded-md bg-night-800 p-4 text-left transition-colors hover:bg-night-700"
          >
            <Avatar name={p.displayName} size={40} />
            <span className="min-w-0">
              <span className="block truncate font-display font-semibold text-parchment">
                {p.displayName}
                {p.uid === user?.uid && (
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
