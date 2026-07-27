"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { characterChalices } from "@/data/chalices";
import { MultiSelect } from "@/components/MultiSelect";
import { BuildCard } from "@/components/builds/BuildCard";
import { BuildEditor } from "@/components/builds/BuildEditor";
import { MyRelics } from "@/components/builds/MyRelics";
import { TagManager } from "@/components/builds/TagManager";
import { chalicesFor, EffectDatalists } from "@/components/builds/shared";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  buildShareUrl,
  loadStore,
  mergeStores,
  newId,
  normalizeStore,
  saveStore,
  sortedTags,
  type Build,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
} from "@/lib/builds";
import { useAuth } from "@/lib/useAuth";
import { useCloudSync } from "@/lib/useCloudSync";

/**
 * User builds, stored locally in the browser and — when signed in — mirrored
 * to the account (see useCloudSync). The list view shows saved builds per
 * Nightfarer; the editor is a full-width view with searchable relic pickers,
 * Deep of Night slots, and a whole-screenshot importer that fills slots from
 * a photo.
 */
export function BuildsManager() {
  const [store, setStore] = useState<BuildStore | null>(null);
  const [view, setView] = useState<"builds" | "relics">("builds");
  // Character filter for the build list — empty shows all Nightfarers.
  const [characterFilter, setCharacterFilter] = useState<string[]>([]);
  // Tag filter — empty means all builds; otherwise builds matching any of
  // the selected tags ("any") or carrying every one of them ("all").
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("any");
  const [managingTags, setManagingTags] = useState(false);
  const [editing, setEditing] = useState<Build | null>(null);
  // Which build the full view is showing (by id, so edits to it show up).
  const [viewingId, setViewingId] = useState<string | null>(null);
  // A localStorage write failed (quota, private mode, storage disabled) —
  // edits now live only in this tab, so warn until a write succeeds again.
  const [storageBroken, setStorageBroken] = useState(false);
  // Which build's share link was just copied (resets the label after a beat).
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const user = useAuth();
  const syncStatus = useCloudSync(store, setStore);

  useEffect(() => {
    setStore(loadStore());
  }, []);

  // Persist every change (the post-load write just re-saves what was loaded,
  // and doubles as an early probe for broken storage).
  useEffect(() => {
    if (store) setStorageBroken(!saveStore(store));
  }, [store]);

  if (!store) {
    return <p className="font-body text-sm text-parchment-faint">Loading saved builds…</p>;
  }

  const update = (fn: (s: BuildStore) => BuildStore) =>
    setStore((prev) => fn(prev ?? EMPTY_STORE));

  const addCustomRelic = (relic: CustomRelic) =>
    update((s) => ({ ...s, customRelics: [...s.customRelics, relic] }));

  const updateCustomRelic = (relic: CustomRelic) =>
    update((s) => ({
      ...s,
      customRelics: s.customRelics.map((r) => (r.id === relic.id ? relic : r)),
    }));

  // ── Tag registry management ────────────────────────────────────────────
  const createTag = (name: string) => {
    const tag = name.trim();
    if (tag) update((s) => ({ ...s, tags: sortedTags([...s.tags, tag]) }));
  };
  const retagBuilds = (builds: Build[], fn: (tags: string[]) => string[]) =>
    builds.map((b) => (b.tags?.length ? { ...b, tags: fn(b.tags) } : b));
  const renameTag = (from: string, to: string) => {
    const tag = to.trim();
    if (!tag || tag === from) return;
    update((s) => ({
      ...s,
      tags: sortedTags(s.tags.map((t) => (t === from ? tag : t))),
      builds: retagBuilds(s.builds, (tags) => sortedTags(tags.map((t) => (t === from ? tag : t)))),
    }));
    setTagFilter((f) => sortedTags(f.map((t) => (t === from ? tag : t))));
  };
  const deleteTag = (tag: string) => {
    if (!window.confirm(`Delete the tag "${tag}"? It will be removed from all builds.`)) return;
    update((s) => ({
      ...s,
      tags: s.tags.filter((t) => t !== tag),
      builds: retagBuilds(s.builds, (tags) => tags.filter((t) => t !== tag)),
    }));
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

  if (editing) {
    return (
      <div>
        {storageBanner}
        <BuildEditor
          key={editing.id}
          initial={editing}
          store={store}
          onSave={(build) => {
            update((s) => ({
              ...s,
              builds: [...s.builds.filter((b) => b.id !== build.id), { ...build, updatedAt: Date.now() }],
            }));
            // Keep the saved build visible: leave "All" alone, but widen a
            // character filter that would hide the build just saved.
            setCharacterFilter((c) =>
              c.length === 0 || c.includes(build.character) ? c : [...c, build.character],
            );
            setView("builds");
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onAddCustomRelic={addCustomRelic}
          onUpdateCustomRelic={updateCustomRelic}
          onCreateTag={createTag}
        />
      </div>
    );
  }

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

  // A single selected Nightfarer seeds the next new build; "all" falls back
  // to the first of the roster.
  const newBuildCharacter =
    characterFilter.length === 1 ? characterFilter[0] : characterChalices[0].name;
  const startNew = () =>
    setEditing({
      id: newId(),
      name: "",
      character: newBuildCharacter,
      chalice: chalicesFor(newBuildCharacter)[0].name,
      slots: [...EMPTY_SLOTS] as SlotTriple,
      deepSlots: [...EMPTY_SLOTS] as SlotTriple,
      notes: "",
      updatedAt: Date.now(),
    });

  const deleteBuild = (id: string) => {
    if (!window.confirm("Delete this build?")) return;
    update((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) }));
    // Deleting the build the full view is showing drops back to the list.
    setViewingId((v) => (v === id ? null : v));
  };

  // Copy a link straight to this build's page in the community directory.
  // Only offered while signed in — the link reads the synced copy, so there
  // is nothing for a visitor to load without an account behind it.
  const shareBuild = async (id: string) => {
    if (!user) return;
    const url = buildShareUrl(user.uid, id);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const deleteCustomRelic = (id: string) => {
    if (!window.confirm("Delete this relic? Builds using it will show an empty slot.")) return;
    const strip = (slots: SlotTriple): SlotTriple =>
      slots.map((s) => (s?.kind === "custom" && s.id === id ? null : s)) as SlotTriple;
    update((s) => ({
      ...s,
      customRelics: s.customRelics.filter((r) => r.id !== id),
      builds: s.builds.map((b) => ({ ...b, slots: strip(b.slots), deepSlots: strip(b.deepSlots) })),
    }));
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

  // ── Single build view ──────────────────────────────────────────────────
  // Opened by clicking a tile in the list: the same full card the community
  // pages show, with this build's actions on a toolbar above it.
  const viewing = viewingId ? store.builds.find((b) => b.id === viewingId) : undefined;
  if (viewing) {
    const btn =
      "frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment";
    return (
      <div>
        {storageBanner}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setViewingId(null)} className={btn}>
            ← Back to builds
          </button>
          <button type="button" onClick={() => setEditing(viewing)} className={`${btn} text-gold-bright`}>
            Edit
          </button>
          {user && (
            <button type="button" onClick={() => void shareBuild(viewing.id)} className={btn}>
              {copiedId === viewing.id ? "Link copied ✓" : "Copy link"}
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteBuild(viewing.id)}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-red-300"
          >
            Delete
          </button>
        </div>
        <BuildCard build={viewing} store={store} />
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
                    onOpen={() => setViewingId(b.id)}
                    onEdit={() => setEditing(b)}
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

      <EffectDatalists />
    </div>
  );
}
