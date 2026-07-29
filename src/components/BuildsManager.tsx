"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { characterChalices } from "@/data/chalices";
import { MultiSelect } from "@/components/MultiSelect";
import { BuildCard } from "@/components/builds/BuildCard";
import { BuildEditor } from "@/components/builds/BuildEditor";
import { ImportRelics } from "@/components/builds/ImportRelics";
import { MyRelics } from "@/components/builds/MyRelics";
import { TagManager } from "@/components/builds/TagManager";
import { FilterPanel, FilterToggle } from "@/components/builds/FilterPanel";
import { CharacterImg, chalicesFor, CopyLinkButton, resolveSlot } from "@/components/builds/shared";
import {
  EMPTY_QUERY,
  describeQuery,
  isEmptyQuery,
  matchesQuery,
  withKnownTags,
  type FilterQuery,
  type FilterSubject,
} from "@/lib/filterQuery";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  buildPath,
  buildShareText,
  buildShareUrl,
  newId,
  relicTagTombstone,
  sortedTags,
  tagTombstone,
  variantAt,
  variantCount,
  variantIdxFromParam,
  withTombstones,
  withoutTombstones,
  type Build,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
} from "@/lib/builds";
import { useAuth } from "@/lib/cloud";
import { useAccountStore } from "@/lib/useAccountStore";
import {
  LegacyImportCard,
  LoadFailed,
  OfflineBanner,
  SignInWall,
} from "@/components/builds/AccountGate";
import { MyNickname } from "@/components/builds/NicknameCard";

/** Shared look for the toolbar above a single build. */
const TOOLBAR_BTN =
  "frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment";

/**
 * A signed-in account's builds (see useAccountStore — the store lives in the
 * account, backed by a local cache). The list view shows saved builds per
 * Nightfarer; opening one gives it its own page, with the editor — searchable
 * relic pickers, Deep of Night slots, and a whole-screenshot importer — in
 * that same view. Signed out there is nothing to show, and the page is a
 * sign-in prompt instead.
 *
 * Which build is open lives in the URL rather than in state, so a build and
 * its editor can be linked and survive a refresh: ?b=<id> is one build,
 * ?b=<id>&edit=1 its editor, and ?b=new a build that doesn't exist yet.
 * These links are personal — they open *your* copy, and only for you. What
 * travels is the build's Community Builds page, which Copy share link on the
 * open build hands over (see buildShareUrl).
 */
export function BuildsManager() {
  const {
    store,
    setStore,
    status,
    error,
    retry,
    cacheBroken,
    legacy,
    importLegacy,
    dismissLegacy,
  } = useAccountStore();
  const [view, setView] = useState<"builds" | "relics" | "import">("builds");
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("b");
  const isNew = openId === "new";
  const isEditing = isNew || params.get("edit") !== null;
  // ?delete=1 — a delete asked for from somewhere without the store in hand
  // (your own build on its community page). Deleting happens here, where the
  // store and its tombstones are, and only after the same confirm as the
  // button below.
  const wantsDelete = !isNew && params.get("delete") !== null;
  // Whose build the URL claims to be (see withOwner). Absent on anything
  // older than that change.
  const ownerUid = params.get("u");
  // Which loadout of a build with variants is on show — in the URL so the
  // share link copied here points at that same one (see buildPath).
  const variantParam = params.get("v");
  // Character filter for the build list — empty shows all Nightfarers.
  const [characterFilter, setCharacterFilter] = useState<string[]>([]);
  // Advanced filter — tags and effect text, and/any/none (see lib/filterQuery).
  // An empty query shows everything.
  const [query, setQuery] = useState<FilterQuery>(EMPTY_QUERY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  // The unsaved build behind ?b=new — it has no store entry to read back.
  const [draft, setDraft] = useState<Build | null>(null);
  // Only for the share link and the owner check below — the account's uid is
  // what a build's community page is addressed by. Loading and saving the
  // store is entirely useAccountStore's business.
  const user = useAuth();

  // A single selected Nightfarer seeds the next new build; "all" falls back
  // to the first of the roster.
  const newBuildCharacter =
    characterFilter.length === 1 ? characterFilter[0] : characterChalices[0].name;

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

  // A tag the registry has lost — deleted here, or on another device between
  // syncs — stops filtering, rather than quietly hiding every build.
  useEffect(() => {
    if (store) setQuery((q) => withKnownTags(q, store.tags));
  }, [store]);

  // A build's page addressed to an account that isn't yours came from someone
  // else's address bar, and this page can't show it — ?b= reads out of *your*
  // store. Hand it to where that build does live: the owner's community
  // page, view-only. Your own uid is deliberately not redirected — that's
  // your build on a device that may simply not have synced it yet.
  useEffect(() => {
    if (!store || !openId || isNew || !ownerUid) return;
    if (user === undefined || ownerUid === user?.uid) return;
    if (store.builds.some((b) => b.id === openId)) return;
    // The variant travels along raw — the build isn't here to clamp it
    // against, and the community page does that on arrival.
    router.replace(buildPath(ownerUid, openId, Math.max(0, Math.trunc(Number(variantParam)) || 0)));
  }, [store, openId, isNew, ownerUid, variantParam, user, router]);

  // A ?delete=1 link, asked once and only for a build the account actually
  // holds — a missing one falls through to the message below, and re-asking
  // on every render would be worse than saying nothing. Either answer strips
  // the intent from the URL, so a refresh doesn't ask again.
  const deleteAsked = useRef(false);
  useEffect(() => {
    if (!store || !openId || !wantsDelete || deleteAsked.current) return;
    const build = store.builds.find((b) => b.id === openId);
    if (!build) return;
    deleteAsked.current = true;
    if (!window.confirm(`Delete "${build.name.trim() || "Unnamed build"}"?`)) {
      router.replace(
        `/builds?b=${encodeURIComponent(openId)}${ownerUid ? `&u=${encodeURIComponent(ownerUid)}` : ""}`,
      );
      return;
    }
    setStore((s) => withTombstones(s ?? EMPTY_STORE, [openId]));
    router.replace("/builds");
  }, [store, openId, wantsDelete, ownerUid, router, setStore]);

  // ── Before there's a store: no account, still loading, or a failed load ──
  // Signing out mid-visit lands here too, whatever the URL said.
  if (status === "signed-out") return <SignInWall />;
  if (!store) {
    return status === "error" ? (
      <LoadFailed error={error} onRetry={retry} />
    ) : (
      <p className="font-body text-sm text-parchment-faint">Loading your builds…</p>
    );
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
    renameInQuery(from, tag);
  };
  const deleteTag = (tag: string) => {
    if (!window.confirm(`Delete the tag "${tag}"? It will be removed from all builds.`)) return;
    // The tombstone does the removing — from the registry here, from the
    // builds carrying it, and on every other device at its next sync.
    update((s) => withTombstones(s, [tagTombstone(tag)]));
  };
  /** Put a build's tags on it, from the list view's own tag picker. */
  const setBuildTags = (id: string, tags: string[]) =>
    update((s) => ({
      ...s,
      builds: s.builds.map((b) =>
        b.id === id ? { ...b, tags: sortedTags(tags), updatedAt: Date.now() } : b,
      ),
    }));

  // ── Relic keyword registry ─────────────────────────────────────────────
  // The same three operations over relicTags. Kept apart from build tags on
  // purpose: the two vocabularies are different (see CustomRelic.tags).
  const createRelicTag = (name: string) => {
    const tag = name.trim();
    if (tag) {
      update((s) =>
        withoutTombstones({ ...s, relicTags: sortedTags([...s.relicTags, tag]) }, [
          relicTagTombstone(tag),
        ]),
      );
    }
  };
  const renameRelicTag = (from: string, to: string) => {
    const tag = to.trim();
    if (!tag || tag === from) return;
    update((s) =>
      withTombstones(
        withoutTombstones(
          {
            ...s,
            relicTags: sortedTags(s.relicTags.map((t) => (t === from ? tag : t))),
            customRelics: s.customRelics.map((r) =>
              r.tags?.includes(from)
                ? { ...r, tags: sortedTags(r.tags.map((t) => (t === from ? tag : t))) }
                : r,
            ),
          },
          [relicTagTombstone(tag)],
        ),
        [relicTagTombstone(from)],
      ),
    );
    renameInQuery(from, tag);
  };
  const deleteRelicTag = (tag: string) => {
    if (!window.confirm(`Delete the tag "${tag}"? It will be removed from all relics.`)) return;
    update((s) => withTombstones(s, [relicTagTombstone(tag)]));
  };
  const setRelicTags = (id: string, tags: string[]) =>
    update((s) => ({
      ...s,
      customRelics: s.customRelics.map((r) => (r.id === id ? { ...r, tags: sortedTags(tags) } : r)),
    }));

  /** Follow a rename through the active filter, so it keeps filtering. */
  function renameInQuery(from: string, to: string) {
    setQuery((q) => ({
      ...q,
      tagsAll: sortedTags(q.tagsAll.map((t) => (t === from ? to : t))),
      tagsAny: sortedTags(q.tagsAny.map((t) => (t === from ? to : t))),
      tagsNone: sortedTags(q.tagsNone.map((t) => (t === from ? to : t))),
    }));
  }

  // Shown above every view — none of these are about the view you're in.
  const banners = (
    <>
      {status === "offline" && <OfflineBanner onRetry={retry} />}
      {legacy && (
        <LegacyImportCard legacy={legacy} onImport={importLegacy} onDismiss={dismissLegacy} />
      )}
      {cacheBroken && (
        <section
          className="frame mb-5 rounded-md bg-night-850 p-4"
          style={{ borderColor: "rgb(248 113 113 / 0.6)" }}
        >
          <p className="font-body text-sm text-red-200">
            Couldn&rsquo;t keep a backup copy in this browser.
          </p>
          <p className="mt-1 font-body text-xs text-parchment-faint">
            Your changes still go to your account — but if it can&rsquo;t be reached, there
            will be nothing here to fall back on. This usually means storage is full or
            disabled (private browsing); the notice clears once it works again.
          </p>
        </section>
      )}
    </>
  );

  const ownBuilds = store.builds;
  // What the filter runs against: the build's own words, plus every effect
  // line it slots — across all of its variants, since a build "has" an effect
  // if any of its loadouts does.
  const buildSubject = (b: Build): FilterSubject => {
    const effects: string[] = [];
    for (let i = 0; i < variantCount(b); i++) {
      const v = variantAt(b, i);
      for (const slot of [...v.slots, ...v.deepSlots]) {
        for (const line of resolveSlot(slot, store)?.lines ?? []) {
          effects.push(line.text);
          if (line.demerit) effects.push(line.demerit);
        }
      }
    }
    return { labels: [b.name, b.character, b.chalice], effects, tags: b.tags ?? [] };
  };
  const builds = ownBuilds
    .filter((b) => characterFilter.length === 0 || characterFilter.includes(b.character))
    .filter((b) => matchesQuery(query, buildSubject(b)));
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


  // ── One build's own page: ?b=<id>, and ?b=<id>&edit=1 to change it ─────
  // The build behind the URL — the unsaved draft for ?b=new, otherwise the
  // stored build, so edits to it show up here.
  const openBuild = isNew ? draft : openId ? store.builds.find((b) => b.id === openId) : undefined;

  if (openId && !openBuild) {
    // Either the draft hasn't been created yet (a render away) or the id is
    // stale — a deleted build, or one belonging to another account.
    //
    // A link naming an account that isn't yours is the redirect above on its
    // way out, so say that rather than flashing "no such build". While auth
    // is still restoring the owner is unknown, and this assumes it's a shared
    // link: guessing wrong only costs a beat of "Opening…" before the message
    // corrects itself, where the reverse flashes an error at every recipient.
    const sharedLink = !!ownerUid && ownerUid !== user?.uid;
    return (
      <div>
        {banners}
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
              No such build in your account — it may have been deleted, or it may
              belong to another account.
            </p>
          </>
        )}
      </div>
    );
  }

  if (openBuild && isEditing) {
    return (
      <div>
        {banners}
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
    // This page is personal — ?b= opens *your* copy, so the link to hand
    // someone is the build's page in the community directory. The one thing
    // that means there's no link to copy is a build kept off the profile.
    // Sync state deliberately isn't one — it's a moment in time (every edit
    // passes through "syncing"), while the link is permanent, so it's said
    // in the tooltip, not enforced.
    // Which loadout the card shows, and so which one the share link opens on.
    // Switching tabs replaces rather than pushes, so Back still leaves the
    // build rather than walking back through its variants.
    const variantIdx = variantIdxFromParam(variantParam, openBuild);
    const showVariant = (i: number) =>
      router.replace(withOwner(`/builds?b=${encodeURIComponent(openBuild.id)}`) + (i > 0 ? `&v=${i}` : ""), {
        scroll: false,
      });
    const shareUrl = user ? buildShareUrl(user.uid, openBuild.id, variantIdx) : "";
    const shareBlocked =
      openBuild.public === false ? "This build is hidden from your community profile." : undefined;
    const shareHint =
      status === "offline"
        ? "Copies this build’s community page — but your account can’t be reached, so it may not open for others yet."
        : status === "synced"
          ? "Copies this build’s community page — anyone can open it, view-only."
          : "Copies this build’s community page — it opens for others once this build finishes saving to your account.";
    return (
      <div>
        {banners}
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
            text={buildShareText(openBuild, shareUrl, variantIdx)}
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
        <BuildCard
          build={openBuild}
          store={store}
          variantIdx={variantIdx}
          onVariantChange={showVariant}
          tagRegistry={store.tags}
          onTagsChange={(tags) => setBuildTags(openBuild.id, tags)}
          onCreateTag={createTag}
        />
      </div>
    );
  }

  // Spell the query out in words — an and/or/not filter built from six rows
  // is much easier to trust when the list says what it's showing.
  const filterSummary = !isEmptyQuery(query) && (
    <p className="-mt-3 mb-5 font-body text-xs text-parchment-faint">
      Showing builds{" "}
      <span className="text-parchment-muted">{describeQuery(query).join(", ")}</span>.
    </p>
  );

  return (
    <div>
      {banners}

      {/* The name your builds appear under, editable here as well as in the
          community directory. */}
      <MyNickname synced={status === "synced"} />

      {/* Builds / My Relics / Import view switch */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-night-700">
        {(
          [
            { key: "builds", label: "Builds", count: ownBuilds.length },
            { key: "relics", label: "My Relics", count: store.customRelics.length },
            { key: "import", label: "Import Relics", count: 0 },
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
      {/* Primary CTA — on its own line, ahead of the filtering toolbar. */}
      <div className="mb-4">
        <button
          type="button"
          onClick={startNew}
          className="rounded-md border border-gold-bright bg-gold px-6 py-3 font-display text-base font-semibold text-night-950 shadow-seal transition hover:bg-gold-bright"
        >
          + New build
        </button>
      </div>

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
        <input
          type="text"
          value={query.text}
          onChange={(e) => setQuery((q) => ({ ...q, text: e.target.value }))}
          placeholder="Search builds or effects…"
          aria-label="Search builds or effects"
          className="frame w-56 max-w-full rounded-md bg-night-900 px-2.5 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <FilterToggle query={query} open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} />
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
        <span className="font-body text-xs text-parchment-faint">
          {status === "syncing" && "Saving to your account…"}
          {status === "synced" && "Saved to your account."}
          {status === "offline" && (
            <span className="text-red-200">
              Not saved to your account yet — kept in this browser for now.
            </span>
          )}
        </span>
      </div>

      {filtersOpen && (
        <FilterPanel
          query={query}
          onChange={setQuery}
          tags={store.tags}
          noun="build"
          onManageTags={() => setManagingTags(true)}
        />
      )}

      {filterSummary}

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
          {!isEmptyQuery(query)
            ? "No builds match the filter."
            : `No builds ${
                characterFilter.length > 0 ? `for ${characterFilter.join(" or ")} ` : ""
              }yet — create one to get started.`}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.name}>
              {/* The portrait rides the section heading rather than each
                  tile: the tiles under it are all the same Nightfarer, so a
                  face per card would repeat the same picture down a column,
                  and a heading row has width to spare at every size. */}
              <h4 className="eyebrow mb-2 flex items-center gap-2 border-b border-night-700 pb-1.5 text-gold-dim">
                <CharacterImg name={g.name} size={24} />
                {g.name}
                <span className="font-body text-xs normal-case tracking-normal text-parchment-faint">
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
                    tagRegistry={store.tags}
                    onTagsChange={(tags) => setBuildTags(b.id, tags)}
                    onCreateTag={createTag}
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
          onImport={() => setView("import")}
          tagRegistry={store.relicTags}
          onTagsChange={setRelicTags}
          onCreateTag={createRelicTag}
          onRenameTag={renameRelicTag}
          onDeleteTag={deleteRelicTag}
        />
      )}

      {/* Hidden rather than unmounted: reading four screenshots on a phone
          takes minutes, and switching tabs to check a build mid-run shouldn't
          throw the run — or the cards waiting to be reviewed — away. */}
      <div hidden={view !== "import"}>
        <ImportRelics
          relics={store.customRelics}
          onAdd={addCustomRelic}
          onDone={() => setView("relics")}
        />
      </div>
    </div>
  );
}
