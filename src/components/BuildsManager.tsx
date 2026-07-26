"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { characterChalices } from "@/data/chalices";
import { Dropdown } from "@/components/Dropdown";
import { MultiSelect } from "@/components/MultiSelect";
import { BuildCard } from "@/components/builds/BuildCard";
import { BuildEditor } from "@/components/builds/BuildEditor";
import { MyRelics } from "@/components/builds/MyRelics";
import { TagManager } from "@/components/builds/TagManager";
import { chalicesFor, EffectDatalists } from "@/components/builds/shared";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  decodeSharedBuild,
  loadStore,
  mergeStores,
  newId,
  normalizeStore,
  saveStore,
  sortedTags,
  type Build,
  type BuildStore,
  type CustomRelic,
  type SharedBuild,
  type SlotTriple,
} from "@/lib/builds";
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
  const [view, setView] = useState<"builds" | "sharedBuilds" | "relics">("builds");
  // Character filter for the build list — "" shows all Nightfarers.
  const [character, setCharacter] = useState("");
  // Tag filter — empty means all builds; otherwise builds matching any of
  // the selected tags ("any") or carrying every one of them ("all").
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("any");
  const [managingTags, setManagingTags] = useState(false);
  const [editing, setEditing] = useState<Build | null>(null);
  const [shared, setShared] = useState<SharedBuild | null>(null);
  // A localStorage write failed (quota, private mode, storage disabled) —
  // edits now live only in this tab, so warn until a write succeeds again.
  const [storageBroken, setStorageBroken] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const syncStatus = useCloudSync(store, setStore);

  useEffect(() => {
    setStore(loadStore());
    // A share link carries a build in the hash — offer it for import. The
    // hash is cleared as soon as it's read: the offer lives in state (the
    // Builds-tab banner) until kept, dismissed, or the page is left, and a
    // reload won't re-trigger it.
    const m = window.location.hash.match(/^#b=(.+)$/);
    if (m) {
      decodeSharedBuild(m[1]).then((sb) => {
        setShared(sb);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      });
    }
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
            // Keep the saved build visible: leave "All" alone, but move a
            // character filter to the build's character.
            setCharacter((c) => (c ? build.character : c));
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

  // Your own builds live in the Builds tab; view-only builds kept from
  // friends' share links get their own Shared Builds tab. The tag filter
  // applies to both tabs.
  const ownBuilds = store.builds.filter((b) => !b.shared);
  const allSharedBuilds = store.builds.filter((b) => b.shared);
  const matchesTagFilter = (b: Build) =>
    tagFilter.length === 0 ||
    (tagMode === "any"
      ? tagFilter.some((t) => b.tags?.includes(t))
      : tagFilter.every((t) => b.tags?.includes(t)));
  const sharedBuilds = allSharedBuilds
    .filter(matchesTagFilter)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const builds = ownBuilds
    .filter((b) => !character || b.character === character)
    .filter(matchesTagFilter)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const newBuildCharacter = character || characterChalices[0].name;
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
  };

  // Annotation edits (tags/subtitle on shared builds) deliberately leave
  // updatedAt alone so relabeling a build doesn't reshuffle the list.
  const setBuildMeta = (id: string, patch: Partial<Pick<Build, "tags" | "subtitle">>) =>
    update((s) => ({
      ...s,
      builds: s.builds.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));

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

  const dismissShared = () => setShared(null);

  const importShared = () => {
    if (!shared) return;
    // Saved as view-only: the friend's relics stay embedded in the build
    // (you don't own them), so nothing is added to your relic pool.
    const build: Build = {
      ...shared.build,
      id: newId(),
      updatedAt: Date.now(),
      shared: true,
      relics: shared.relics,
    };
    update((s) => ({ ...s, builds: [...s.builds, build] }));
    setView("sharedBuilds");
    dismissShared();
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

  // Tag filter controls — shared between the Builds and Shared Builds tabs
  // (they read the same tagFilter/tagMode state).
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
            { key: "sharedBuilds", label: "Shared Builds", count: allSharedBuilds.length },
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
      {/* Share-link banner — lives on this tab; browse other tabs and come
          back to it any time until it's kept, dismissed, or the page left. */}
      {shared && (
        <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "#c9a227" }}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-parchment">Shared build</h3>
            <span className="font-body text-xs text-parchment-faint">
              This link carries a {shared.build.character} build — keep it in Shared Builds
              (view only; its relics won&rsquo;t join your relic pool), or dismiss it.
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={importShared}
                className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
              >
                Keep (view only)
              </button>
              <button
                type="button"
                onClick={dismissShared}
                className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:text-parchment"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="mt-3 max-w-4xl">
            <BuildCard
              build={{ ...shared.build, id: "shared-preview", updatedAt: 0 }}
              store={{ version: 3, builds: [], customRelics: shared.relics, tags: [] }}
            />
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Dropdown
          value={character}
          onChange={setCharacter}
          placeholder="All Nightfarers"
          options={characterChalices.map((c) => {
            const count = ownBuilds.filter((b) => b.character === c.name).length;
            return { value: c.name, label: count > 0 ? `${c.name} (${count})` : c.name };
          })}
          className="w-52"
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

      {builds.length === 0 ? (
        <p className="font-body text-sm text-parchment-faint">
          {tagFilter.length > 0
            ? "No builds match the selected tags."
            : `No builds ${character ? `for ${character} ` : ""}yet — create one, or import a backup.`}
        </p>
      ) : (
        // Single column: cards lay normal and Deep of Night side by side
        // internally, so they want the full page width.
        <div className="grid gap-3">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} store={store} expandable onEdit={() => setEditing(b)} onDelete={() => deleteBuild(b.id)} />
          ))}
        </div>
      )}
        </>
      )}

      {view === "sharedBuilds" && (
        <>
          <p className="mb-5 font-body text-xs text-parchment-faint">
            Builds kept from friends&rsquo; share links — view only. Their relics stay out of
            your relic pool; delete a build to remove it. Use each card&rsquo;s
            &ldquo;Tags&rdquo; button to add your own tags or a subtitle without touching
            the build itself.
          </p>
          {allSharedBuilds.length > 0 && tagFilterControls && (
            <div className="mb-5 flex flex-wrap items-center gap-2">{tagFilterControls}</div>
          )}
          {tagFilterSummary}
          {allSharedBuilds.length === 0 ? (
            <p className="font-body text-sm text-parchment-faint">
              No shared builds yet — open a share link from a friend and choose
              &ldquo;Keep (view only)&rdquo;.
            </p>
          ) : sharedBuilds.length === 0 ? (
            <p className="font-body text-sm text-parchment-faint">
              No shared builds match the selected tags.
            </p>
          ) : (
            <div className="grid gap-3">
              {sharedBuilds.map((b) => (
                <BuildCard
                  key={b.id}
                  build={b}
                  store={store}
                  expandable
                  onDelete={() => deleteBuild(b.id)}
                  annotate={{
                    tags: store.tags,
                    onCreateTag: createTag,
                    onChange: (patch) => setBuildMeta(b.id, patch),
                  }}
                />
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
