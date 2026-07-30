"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Community directory: everyone who has signed in and synced, and a
//  read-only view of any user's public builds. Profiles are addressable as
//  /builds/users?u=<uid>, and a single build as ?u=<uid>&b=<buildId> (a
//  static export can't prerender /users/{uid}/{buildId} paths, so the ids
//  ride the query string). Both are readable without signing in — signing
//  in only adds syncing and the nickname editor.
//
//  A &from=<path> on either link is where the visit came from (a party
//  slot's "profile →", say) and puts a button back there on the page, so a
//  detour into a profile isn't a one-way trip out of wherever you were.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { characterChalices } from "@/data/chalices";
import { BuildCard } from "@/components/builds/BuildCard";
import { CharacterImg, CopyLinkButton } from "@/components/builds/shared";
import { NicknameCard } from "@/components/builds/NicknameCard";
import { MultiSelect } from "@/components/MultiSelect";
import { cloudErrorMessage } from "@/lib/cloudRead";
import { listProfiles, pullCloudStore, useAuth, type UserProfile } from "@/lib/cloud";
import {
  EMPTY_STORE,
  buildPath,
  buildShareText,
  buildShareUrl,
  ownBuildPath,
  sortedTags,
  variantIdxFromParam,
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
 * The return path a &from= carries, or null if it isn't one this app can
 * navigate to — only in-app paths, never an absolute or protocol-relative
 * URL someone pasted into the link.
 */
function safeReturnPath(v: string | null): string | null {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

/** What the return button says, going by where it points. */
function returnLabel(path: string): string {
  if (path.startsWith("/builds/party")) return "← Back to the party";
  if (path.startsWith("/builds")) return "← Back to builds";
  return "← Back";
}

/** Carry a return path onto another in-app link (all of ours have a query). */
function withReturn(href: string, from: string | null): string {
  return from ? `${href}&from=${encodeURIComponent(from)}` : href;
}

/** Button back to wherever a &from= link came from. */
function ReturnButton({ to }: { to: string }) {
  return (
    <Link
      href={to}
      className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-gold-dim hover:bg-night-700 hover:text-gold-bright"
    >
      {returnLabel(to)}
    </Link>
  );
}

/**
 * Edit and Delete for a build of your own found here. This directory is
 * everyone's read-only view of an account's builds, so both hand the build
 * over to the Builds page, which owns the editor, the confirm and the
 * tombstone.
 */
function OwnerActions({ uid, buildId }: { uid: string; buildId: string }) {
  return (
    <>
      <Link
        href={ownBuildPath(uid, buildId, "edit")}
        title="Open this build in the editor, on your Builds page"
        className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-700"
      >
        Edit
      </Link>
      <Link
        href={ownBuildPath(uid, buildId, "delete")}
        title="Delete this build — your Builds page asks first"
        className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-red-300"
      >
        Delete
      </Link>
    </>
  );
}

/**
 * A read that failed, with a way to try again. Firestore reads are given a
 * deadline (see cloudRead) precisely so this can replace an endless
 * "Loading…" — a blocked connection otherwise hangs forever in silence.
 */
function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="frame rounded-md border border-red-900/60 bg-night-850 px-4 py-3" role="alert">
      <p className="font-body text-sm text-red-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * One user's public builds with browse filters: their Nightfarers (only the
 * ones they have builds for) and the tags in use on those builds. Mounted
 * with key={uid}, so filters reset when switching profiles.
 */
function ProfileBuilds({
  store,
  uid,
  from,
  owned,
}: {
  store: BuildStore;
  uid: string;
  /** Return path to carry into each build's own page (see withReturn). */
  from: string | null;
  /** This is the signed-in user's own profile — cards get Edit/Delete. */
  owned: boolean;
}) {
  const router = useRouter();
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
              {/* Portrait on the heading, not the tiles — every build under
                  it is the same Nightfarer (as on the Builds page). */}
              <h4 className="eyebrow mb-2 flex items-center gap-2 border-b border-night-700 pb-1.5 text-gold-dim">
                <CharacterImg name={g.name} size={24} />
                {g.name}
                <span className="font-body text-xs normal-case tracking-normal text-parchment-faint">
                  {g.builds.length}
                </span>
              </h4>
              {/* Same tile shape and columns as the Builds page: the relics
                  sit under the name rather than beside it, so a narrower
                  column costs the name nothing and a row fits three. */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.builds.map((b) => (
                  <BuildCard
                    key={b.id}
                    build={b}
                    store={store}
                    href={withReturn(buildPath(uid, b.id), from)}
                    // Your own builds are editable — but only where the
                    // editable copy is, so both actions leave for /builds.
                    onEdit={owned ? () => router.push(ownBuildPath(uid, b.id, "edit")) : undefined}
                    onDelete={owned ? () => router.push(ownBuildPath(uid, b.id, "delete")) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
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
  // Which loadout of that build — see buildPath. Only meaningful once the
  // build is in hand, since it's clamped to the variants it actually has.
  const variantParam = params.get("v");
  // Where this visit came from, if it was linked from elsewhere in the app.
  const from = safeReturnPath(params.get("from"));
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  // The selected user's synced store; their builds resolve against it.
  const [selectedStore, setSelectedStore] = useState<BuildStore | null>(null);
  // Failures are per-read: the directory and the selected store are separate
  // requests, and either can fail on its own.
  const [dirError, setDirError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  // Bumped by "Try again", which re-runs both reads.
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setDirError(null);
    setStoreError(null);
    setProfiles(null);
    setSelectedStore(null);
    setAttempt((a) => a + 1);
  };

  useEffect(() => {
    let cancelled = false;
    listProfiles()
      .then((p) => !cancelled && setProfiles(p))
      .catch((err) => {
        console.error("Loading user directory failed:", err);
        if (!cancelled) setDirError(cloudErrorMessage(err, "the user directory"));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!selectedUid) return;
    let cancelled = false;
    setSelectedStore(null);
    setStoreError(null);
    pullCloudStore(selectedUid)
      .then((s) => !cancelled && setSelectedStore(s ?? EMPTY_STORE))
      .catch((err) => {
        console.error("Loading user's builds failed:", err);
        if (!cancelled) setStoreError(cloudErrorMessage(err, "these builds"));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUid, attempt]);

  // The directory carries every profile name, so nothing below can render
  // without it — but the message says why, and the retry re-runs the read.
  if (dirError) {
    return <LoadError message={dirError} onRetry={retry} />;
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
    // The tabs live in the URL here, so the link on the clipboard is always
    // the loadout on screen — and switching tabs replaces rather than pushes,
    // so Back still leaves the build instead of walking its variants.
    const variantIdx = build ? variantIdxFromParam(variantParam, build) : 0;
    const showVariant = (i: number) =>
      router.replace(withReturn(buildPath(selectedUid, selectedBuildId, i), from), {
        scroll: false,
      });
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {from && <ReturnButton to={from} />}
          <Link
            href={withReturn(`/builds/users?u=${encodeURIComponent(selectedUid)}`, from)}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            ← {owner ? `${owner}’s builds` : "All builds"}
          </Link>
          {build && (
            <CopyLinkButton
              url={buildShareUrl(selectedUid, selectedBuildId, variantIdx)}
              text={buildShareText(
                build,
                buildShareUrl(selectedUid, selectedBuildId, variantIdx),
                variantIdx,
              )}
            />
          )}
          {build && selectedUid === user?.uid && (
            <OwnerActions uid={selectedUid} buildId={selectedBuildId} />
          )}
        </div>
        {storeError ? (
          <LoadError message={storeError} onRetry={retry} />
        ) : !selectedStore ? (
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
                  {selected.uid === user?.uid
                    ? " (you) — view-only here; Edit and Delete open your own copy."
                    : " — view-only."}
                </p>
              </div>
            )}
            <BuildCard
              build={build}
              store={selectedStore}
              variantIdx={variantIdx}
              onVariantChange={showVariant}
            />
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
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {from && <ReturnButton to={from} />}
          <button
            type="button"
            onClick={() => router.push("/builds/users")}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            ← All users
          </button>
        </div>
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
                  {selected.uid === user?.uid
                    ? "This is you — open a build for its own page and a share link, or edit and delete your own copy from here."
                    : "Builds are view-only — open one for its own page and a share link."}
                </p>
              </div>
            </div>
            {storeError ? (
              <LoadError message={storeError} onRetry={retry} />
            ) : !selectedStore ? (
              <p className="font-body text-sm text-parchment-faint">Loading builds…</p>
            ) : (
              <ProfileBuilds
                key={selectedUid}
                store={selectedStore}
                uid={selectedUid}
                from={from}
                owned={selectedUid === user?.uid}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // ── Directory list ─────────────────────────────────────────────────────
  const me = user ? profiles.find((p) => p.uid === user.uid) : undefined;

  return (
    <div>
      {/* Your public identity — swap the Google name for a nickname any time. */}
      {me && (
        <NicknameCard
          uid={me.uid}
          name={me.displayName}
          onSaved={(name) =>
            setProfiles((ps) => ps?.map((p) => (p.uid === me.uid ? { ...p, displayName: name } : p)) ?? ps)
          }
        />
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
