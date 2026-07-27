"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { characterChalices } from "@/data/chalices";
import { MultiSelect } from "@/components/MultiSelect";
import { BuildCard } from "@/components/builds/BuildCard";
import { BuildEditor } from "@/components/builds/BuildEditor";
import { MyRelics } from "@/components/builds/MyRelics";
import { TagManager } from "@/components/builds/TagManager";
import { chalicesFor, CopyLinkButton } from "@/components/builds/shared";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  buildPath,
  buildShareText,
  buildShareUrl,
  loadStore,
  mergeStores,
  newId,
  normalizeStore,
  saveStore,
  sortedTags,
  tagTombstone,
  withTombstones,
  withoutTombstones,
  type Build,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
} from "@/lib/builds";
import { useAuth } from "@/lib/useAuth";
import { useCloudSync } from "@/lib/useCloudSync";

/** Shared look for the toolbar above a single build. */
const TOOLBAR_BTN =
  "frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment";

/**
 * User builds, stored locally in the browser and — when signed in — mirrored
 * to the account (see useCloudSync). The list view shows saved builds per
 * Nightfarer; opening one gives it its own page, with the editor — searchable
 * relic pickers, Deep of Night slots, and a whole-screenshot importer — in
 * that same view.
 *
 * Which build is open lives in the URL rather than in state, so a build and
 * its editor can be linked and survive a refresh: ?b=<id> is one build,
 * ?b=<id>&edit=1 its editor, and ?b=new a build that doesn't exist yet.
 * These links are personal — the builds are in this browser, not on the
 * server. What travels is the build's Community Builds page, which Copy
 * share link on the open build hands over (see buildShareUrl).
 */
export function BuildsManager() {
  const [store, setStore] = useState<BuildStore | null>(null);
  const [view, setView] = useState<"builds" | "relics">("builds");
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("b");
  const isNew = openId === "new";
  const isEditing = isNew || params.get("edit") !== null;
  // Whose build the URL claims to be (see withOwner). Absent on links made
  // while signed out, and on anything older than that change.
  const ownerUid = params.get("u");
  // Character filter for the build list — empty shows all Nightfarers.
  const [characterFilter, setCharacterFilter] = useState<string[]>([]);
  // Tag filter — empty means all builds; otherwise builds matching any of
  // the selected tags ("any") or carrying every one of them ("all").
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("any");
  const [managingTags, setManagingTags] = useState(false);
  // The unsaved build behind ?b=new — it has no store entry to read back.
  const [draft, setDraft] = useState<Build | null>(null);
  // A localStorage write failed (quota, private mode, storage disabled) —
  // edits now live only in this tab, so warn until a write succeeds again.
  const [storageBroken, setStorageBroken] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const syncStatus = useCloudSync(store, setStore);
  // Only for the share link — the account's uid is what a build's community
  // page is addressed by. Sync itself is entirely useCloudSync's business.
  const user = useAuth();

  // A single selected Nightfarer seeds the next new build; "all" falls back
  // to the first of the roster.
  const newBuildCharacter =
    characterFilter.length === 1 ? characterFilter[0] : characterChalices[0].name;

  useEffect(() => {
    setStore(loadStore());
  }, []);

  // Make the draft once per visit to ?b=new (so its id — and the editor keyed
  // on it — stay put across renders), and drop it when the editor closes.
  useEffect(() => {
    setDraft((d) => {
      if (!isNew) return null;
      return (
        d ?? {
          id: newId(),
          name: "",
          character: newBuildCharacter,
          chalice: chalicesFor(newBuildCharacter)[0].name,
          slots: [...EMPTY_SLOTS] as SlotTriple,
          deepSlots: [...EMPTY_SLOTS] as SlotTriple,
          notes: "",
          updatedAt: Date.now(),
        }
      );
    });
  }, [isNew, newBuildCharacter]);

  // Persist every change (the post-load write just re-saves what was loaded,
  // and doubles as an early probe for broken storage).
  useEffect(() => {
    if (store) setStorageBroken(!saveStore(store));
  }, [store]);

  // A build's page addressed to an account that isn't yours came from someone
  // else's address bar, and this page can't show it — ?b= reads out of *this*
  // browser. Hand it to where that build does live: the owner's community
  // page, view-only. Your own uid is deliberately not redirected — that's
  // your build on a device that may simply not have synced it yet.
  useEffect(() => {
    if (!store || !openId || isNew || !ownerUid) return;
    if (user === undefined || ownerUid === user?.uid) return;
    if (store.builds.some((b) => b.id === openId)) return;
    router.replace(buildPath(ownerUid, openId));
  }, [store, openId, isNew, ownerUid, user, router]);

  if (!store) {
    return <p className="font-body text-sm text-parchment-faint">Loading saved builds…</p>;
  }

  const update = (fn: (s: BuildStore) => BuildStore) =>
    setStore((prev) => fn(prev ?? EMPTY_STORE));

  // ── Navigation: every view of this page is a URL ───────────────────────
  const showList = () => router.push("/builds");
  // Signed in, a build's URL carries the account as well. The page itself
  // stays personal — ?b= is still read out of this browser — but a link
  // copied from the address bar and passed on can then be recognised as
  // someone else's and sent to its community page, instead of dead-ending.
  const withOwner = (url: string) =>
    user ? `${url}&u=${encodeURIComponent(user.uid)}` : url;
  const showBuild = (id: string) => router.push(withOwner(`/builds?b=${encodeURIComponent(id)}`));
  const editBuild = (id: string) =>
    router.push(withOwner(`/builds?b=${encodeURIComponent(id)}&edit=1`));
  const startNew = () => router.push("/builds?b=new");

  const addCustomRelic = (relic: CustomRelic) =>
    update((s) => ({ ...s, customRelics: [...s.customRelics, relic] }));

  const updateCustomRelic = (relic: CustomRelic) =>
    update((s) => ({
      ...s,
      customRelics: s.customRelics.map((r) => (r.id === relic.id ? relic : r)),
    }));

  // ── Tag registry management ────────────────────────────────────────────
  // A tag deleted before under the same name must stop being deleted when
  // it's made again — tag tombstones are keyed by name, not by a fresh id.
  const createTag = (name: string) => {
    const tag = name.trim();
    if (tag) {
      update((s) => withoutTombstones({ ...s, tags: sortedTags([...s.tags, tag]) }, [tagTombstone(tag)]));
    }
  };
  const retagBuilds = (builds: Build[], fn: (tags: string[]) => string[]) =>
    builds.map((b) => (b.tags?.length ? { ...b, tags: fn(b.tags) } : b));
  const renameTag = (from: string, to: string) => {
    const tag = to.trim();
    if (!tag || tag === from) return;
    update((s) =>
      // The old name is gone (tombstoned so other devices drop it too) and the
      // new one is live, whatever its history.
      withTombstones(
        withoutTombstones(
          {
            ...s,
            tags: sortedTags(s.tags.map((t) => (t === from ? tag : t))),
            builds: retagBuilds(s.builds, (tags) => sortedTags(tags.map((t) => (t === from ? tag : t)))),
          },
          [tagTombstone(tag)],
        ),
        [tagTombstone(from)],
      ),
    );
    setTagFilter((f) => sortedTags(f.map((t) => (t === from ? tag : t))));
  };
  const deleteTag = (tag: string) => {
    if (!window.confirm(`Delete the tag "${tag}"? It will be removed from all builds.`)) return;
    // The tombstone does the removing — from the registry here, from the
    // builds carrying it, and on every other device at its next sync.
    update((s) => withTombstones(s, [tagTombstone(tag)]));
    setTagFilter((f) => f.filter((t) => t !== tag));
  };

  // Shown above every view — storage problems affect all of them.
  const storageBanner = storageBroken && (
    <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "rgb(248 113 113 / 0.6)" }}>
      <p className="font-body text-sm text-red-200">
        Saving to this browser failed — your changes only live in this tab and will be
        lost when it closes.
      </p>
      <p className="mt-1 font-body text-xs text-parchment-faint">
        This usually means storage is full or disabled (private browsing). Use Export
        JSON on the Builds tab to back everything up, then free up space or check your
        browser settings. This notice clears once saving works again.
      </p>
    </section>
  );

  const ownBuilds = store.builds;
  const matchesTagFilter = (b: Build) =>
    tagFilter.length === 0 ||
    (tagMode === "any"
      ? tagFilter.some((t) => b.tags?.includes(t))
      : tagFilter.every((t) => b.tags?.includes(t)));
  const builds = ownBuilds
    .filter((b) => characterFilter.length === 0 || characterFilter.includes(b.character))
    .filter(matchesTagFilter);
  // One section per Nightfarer, in the roster's own order, newest build first
  // within each — easier to scan than one long mixed list.
  const groups = characterChalices
    .map((c) => ({
      name: c.name,
      builds: builds.filter((b) => b.character === c.name).sort((a, b) => b.updatedAt - a.updatedAt),
    }))
    .filter((g) => g.builds.length > 0);

  const saveBuild = (build: Build) => {
    update((s) => ({
      ...s,
      builds: [...s.builds.filter((b) => b.id !== build.id), { ...build, updatedAt: Date.now() }],
    }));
    // Keep the saved build visible on the list behind it: leave "All" alone,
    // but widen a character filter that would hide the build just saved.
    setCharacterFilter((c) =>
      c.length === 0 || c.includes(build.character) ? c : [...c, build.character],
    );
    setView("builds");
    // Saving lands on the build's own page — for a new build, that's the
    // first URL it has.
    showBuild(build.id);
  };

  // Deletes are recorded, not just applied: the tombstone drops the entry
  // here and tells the account's other devices to drop it too, instead of the
  // next sync handing back whatever they still hold.
  const deleteBuild = (id: string) => {
    if (!window.confirm("Delete this build?")) return;
    update((s) => withTombstones(s, [id]));
    // Deleting the build the full view is showing drops back to the list.
    if (openId === id) showList();
  };

  const deleteCustomRelic = (id: string) => {
    if (!window.confirm("Delete this relic? Builds using it will show an empty slot.")) return;
    const strip = (slots: SlotTriple): SlotTriple =>
      slots.map((s) => (s?.kind === "custom" && s.id === id ? null : s)) as SlotTriple;
    const uses = (b: Build) =>
      [
        ...b.slots,
        ...b.deepSlots,
        ...(b.variants ?? []).flatMap((v) => [...v.slots, ...v.deepSlots]),
      ].some((s) => s?.kind === "custom" && s.id === id);
    update((s) =>
      withTombstones(
        {
          ...s,
          // Emptying the slot is an edit to that build — without the stamp, a
          // copy on another device outranks it and puts the slot back.
          builds: s.builds.map((b) =>
            uses(b)
              ? {
                  ...b,
                  slots: strip(b.slots),
                  deepSlots: strip(b.deepSlots),
                  variants: b.variants?.map((v) => ({
                    ...v,
                    slots: strip(v.slots),
                    deepSlots: strip(v.deepSlots),
                  })),
                  updatedAt: Date.now(),
                }
              : b,
          ),
        },
        [id],
      ),
    );
  };


  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nightreign-builds.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const data = normalizeStore(JSON.parse(await file.text()));
      if (!data) throw new Error("bad file");
      update((s) => mergeStores(s, data));
    } catch {
      window.alert("That file doesn't look like a Nightreign builds export.");
    }
  };

  // ── One build's own page: ?b=<id>, and ?b=<id>&edit=1 to change it ─────
  // The build behind the URL — the unsaved draft for ?b=new, otherwise the
  // stored build, so edits to it show up here.
  const openBuild = isNew ? draft : openId ? store.builds.find((b) => b.id === openId) : undefined;

  if (openId && !openBuild) {
    // Either the draft hasn't been created yet (a render away) or the id is
    // stale — a deleted build, or a link from another browser, since these
    // builds live in this one.
    //
    // A link naming an account that isn't yours is the redirect above on its
    // way out, so say that rather than flashing "no such build". While auth
    // is still restoring the owner is unknown, and this assumes it's a shared
    // link: guessing wrong only costs a beat of "Opening…" before the message
    // corrects itself, where the reverse flashes an error at every recipient.
    const sharedLink = !!ownerUid && ownerUid !== user?.uid;
    return (
      <div>
        {storageBanner}
        {isNew ? (
          <p className="font-body text-sm text-parchment-faint">Starting a new build…</p>
        ) : sharedLink ? (
          <p className="font-body text-sm text-parchment-faint">Opening the shared build…</p>
        ) : (
          <>
            <button type="button" onClick={showList} className={TOOLBAR_BTN}>
              ← Back to builds
            </button>
            <p className="mt-4 font-body text-sm text-parchment-faint">
              No such build in this browser — it may have been deleted, or saved on
              another device. Sign in to sync your builds, or import a backup.
            </p>
          </>
        )}
      </div>
    );
  }

  if (openBuild && isEditing) {
    return (
      <div>
        {storageBanner}
        <BuildEditor
          key={openBuild.id}
          initial={openBuild}
          store={store}
          backLabel={isNew ? "← All builds" : "← Back to build"}
          lockCharacter={!isNew}
          onSave={saveBuild}
          onCancel={() => (isNew ? showList() : showBuild(openBuild.id))}
          onAddCustomRelic={addCustomRelic}
          onUpdateCustomRelic={updateCustomRelic}
          onCreateTag={createTag}
        />
      </div>
    );
  }

  if (openBuild) {
    // This page is personal — ?b= reads out of *this* browser, so the link to
    // hand someone is the build's page in the community directory. Only two
    // things mean there's no link to copy: no account to address it to, and a
    // build kept off the profile. Sync state deliberately isn't one of them —
    // it's a moment in time (every edit passes through "syncing"), while the
    // link is permanent, so it's said in the tooltip, not enforced.
    const shareUrl = user ? buildShareUrl(user.uid, openBuild.id) : "";
    const shareBlocked = !user
      ? "Sign in to sync your builds — a share link points at your account’s copy."
      : openBuild.public === false
        ? "This build is hidden from your community profile."
        : undefined;
    const shareHint =
      syncStatus === "error"
        ? "Copies this build’s community page — but the last sync failed, so it may not open for others yet."
        : syncStatus === "synced"
          ? "Copies this build’s community page — anyone can open it, view-only."
          : "Copies this build’s community page — it opens for others once this build finishes saving to your account.";
    return (
      <div>
        {storageBanner}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={showList} className={TOOLBAR_BTN}>
            ← Back to builds
          </button>
          <button
            type="button"
            onClick={() => editBuild(openBuild.id)}
            className={`${TOOLBAR_BTN} text-gold-bright`}
          >
            Edit
          </button>
          <CopyLinkButton
            url={shareUrl}
            text={buildShareText(openBuild, shareUrl)}
            label="Copy share link"
            disabled={!!shareBlocked}
            title={shareBlocked ?? shareHint}
          />
          <button
            type="button"
            onClick={() => deleteBuild(openBuild.id)}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-red-300"
          >
            Delete
          </button>
        </div>
        <BuildCard build={openBuild} store={store} />
      </div>
    );
  }

  const tagFilterControls = store.tags.length > 0 && (
    <>
      <MultiSelect
        values={tagFilter}
        options={store.tags.map((t) => ({ value: t, label: t }))}
        onChange={setTagFilter}
        placeholder="All tags"
        className="w-44"
        showValues
      />
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
    </>
  );

  // Spell the tag filter out in words so the Match any/all choice is
  // self-explanatory: "tagged Boss or Farm" vs "tagged Boss and Farm".
  const tagFilterSummary = tagFilter.length > 0 && (
    <p className="-mt-3 mb-5 font-body text-xs text-parchment-faint">
      Showing builds tagged{" "}
      {tagFilter.map((t, i) => (
        <span key={t}>
          {i > 0 && (tagMode === "any" ? " or " : " and ")}
          <span className="text-parchment-muted">{t}</span>
        </span>
      ))}
      .
    </p>
  );

  return (
    <div>
      {storageBanner}

      {/* Builds / My Relics view switch */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-night-700">
        {(
          [
            { key: "builds", label: "Builds", count: ownBuilds.length },
            { key: "relics", label: "My Relics", count: store.customRelics.length },
          ] as const
        ).map((t) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              aria-pressed={active}
              className={`-mb-px rounded-t-md border-b-2 px-4 py-2 font-display text-sm font-semibold transition-colors ${
                active
                  ? "border-gold-bright text-gold-bright"
                  : "border-transparent text-parchment-muted hover:text-parchment"
              }`}
            >
              {t.label}
              {t.count > 0 && <span className="ml-1.5 font-body text-xs text-parchment-faint">{t.count}</span>}
            </button>
          );
        })}
        <div className="ml-auto flex">
          <Link
            href="/builds/party"
            className="-mb-px rounded-t-md border-b-2 border-transparent px-4 py-2 font-display text-sm font-semibold text-parchment-muted hover:text-parchment"
          >
            Parties
          </Link>
          <Link
            href="/builds/users"
            className="-mb-px rounded-t-md border-b-2 border-transparent px-4 py-2 font-display text-sm font-semibold text-parchment-muted hover:text-parchment"
          >
            Community Builds →
          </Link>
        </div>
      </div>

      {view === "builds" && (
        <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <MultiSelect
          values={characterFilter}
          options={characterChalices.map((c) => {
            const count = ownBuilds.filter((b) => b.character === c.name).length;
            return { value: c.name, label: count > 0 ? `${c.name} (${count})` : c.name };
          })}
          onChange={setCharacterFilter}
          placeholder="All Nightfarers"
          className="w-52"
          showValues
        />
        {tagFilterControls}
        <button type="button" onClick={startNew} className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600">
          + New build
        </button>
        <button
          type="button"
          onClick={() => setManagingTags((m) => !m)}
          aria-pressed={managingTags}
          className={`frame rounded-md px-3 py-1.5 font-body text-sm ${
            managingTags
              ? "bg-night-700 text-gold-bright"
              : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
          }`}
        >
          Manage tags
        </button>
        <button type="button" onClick={exportJson} className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment">
          Export JSON
        </button>
        <button type="button" onClick={() => importRef.current?.click()} className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment">
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        <span className="font-body text-xs text-parchment-faint">
          {syncStatus === "local" &&
            "Saved in this browser only — sign in to sync, or export to back up."}
          {syncStatus === "syncing" && "Saving to your account…"}
          {syncStatus === "synced" && "Saved in this browser and synced to your account."}
          {syncStatus === "error" && (
            <span className="text-red-200">
              Cloud sync failed — changes are still saved in this browser.
            </span>
          )}
        </span>
      </div>

      {tagFilterSummary}

      {managingTags && (
        <TagManager
          tags={store.tags}
          usage={(tag) => store.builds.filter((b) => b.tags?.includes(tag)).length}
          onCreate={createTag}
          onRename={renameTag}
          onDelete={deleteTag}
        />
      )}

      {groups.length === 0 ? (
        <p className="font-body text-sm text-parchment-faint">
          {tagFilter.length > 0
            ? "No builds match the selected tags."
            : `No builds ${
                characterFilter.length > 0 ? `for ${characterFilter.join(" or ")} ` : ""
              }yet — create one, or import a backup.`}
        </p>
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
              {/* Tiles: each is a summary that opens the build's own view, so
                  a row fits several instead of one full-width card each. */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.builds.map((b) => (
                  <BuildCard
                    key={b.id}
                    build={b}
                    store={store}
                    onOpen={() => showBuild(b.id)}
                    onEdit={() => editBuild(b.id)}
                    onDelete={() => deleteBuild(b.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
        </>
      )}

      {view === "relics" && (
        <MyRelics
          relics={store.customRelics}
          onAdd={addCustomRelic}
          onUpdate={updateCustomRelic}
          onDelete={deleteCustomRelic}
        />
      )}
    </div>
  );
}
