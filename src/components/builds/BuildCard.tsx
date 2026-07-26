"use client";

// ─────────────────────────────────────────────────────────────────────────
//  List-view card for one saved build, plus the annotation panel for
//  shared (view-only) builds.
// ─────────────────────────────────────────────────────────────────────────

import { Fragment, useState } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import {
  encodeSharedBuild,
  sortedTags,
  type Build,
  type BuildStore,
  type SlotTriple,
} from "@/lib/builds";
import type { SlotColor } from "@/lib/chalices";
import { chalicesFor, resolveSlot, EffectLines, RelicImg, SlotIconImg } from "./shared";

/** Disclosure chevron for expandable build cards. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 text-parchment-faint transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * One saved build. With onDelete it's an interactive card (Share, Delete,
 * plus Edit when onEdit is given — shared builds are view-only, so the
 * Shared Builds tab omits it); with neither it's a read-only preview
 * (shared-link banner). `expandable` cards start collapsed to a one-line
 * summary (relic icons + tags) and expand on click; `annotate` adds a Tags
 * button for putting your own tags and subtitle on a shared build.
 */
export function BuildCard({
  build,
  store,
  onEdit,
  onDelete,
  annotate,
  expandable = false,
}: {
  build: Build;
  store: BuildStore;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Shared-build annotation: edit tags + subtitle without the build editor. */
  annotate?: {
    tags: string[];
    onCreateTag: (name: string) => void;
    onChange: (patch: Partial<Pick<Build, "tags" | "subtitle">>) => void;
  };
  expandable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!expandable);
  const [annotating, setAnnotating] = useState(false);
  // Mobile-only: which slot set the card shows (desktop always shows both).
  const [view, setView] = useState<"normal" | "deep">("normal");
  const chalice = chalicesFor(build.character).find((c) => c.name === build.chalice);
  const hasDeep = build.deepSlots.some(Boolean);
  // Shared (view-only) builds carry their own relics; slots resolve against
  // those, not the user's pool.
  const relicStore = build.relics?.length
    ? { ...store, customRelics: [...store.customRelics, ...build.relics] }
    : store;

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#b=${await encodeSharedBuild(build, store)}`;
    // The link is the data (no server), so messaging apps can't preview the
    // build — lead with a description line so the paste says what it is.
    const text = `${build.name || "Unnamed build"} — ${build.character} · ${build.chalice}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions, http) — show the link instead.
      window.prompt("Copy this link:", url);
    }
  };
  const renderSlots = (slots: SlotTriple, colors?: readonly SlotColor[]) =>
    slots.map((slot, i) => {
      const resolved = resolveSlot(slot, relicStore);
      return (
        <div key={i} className="flex items-start gap-2.5">
          {resolved ? (
            <>
              <RelicImg src={resolved.icon} alt={resolved.name} size={32} />
              <div className="min-w-0">
                <p className="font-body text-base text-parchment">{resolved.name}</p>
                <EffectLines lines={resolved.lines} size="sm" className="mt-0.5 space-y-0.5" />
              </div>
            </>
          ) : (
            <>
              {colors?.[i] && <SlotIconImg color={colors[i]} size={24} />}
              <p className="font-body text-sm text-parchment-faint">Empty slot</p>
            </>
          )}
        </div>
      );
    });
  const normalRows = renderSlots(build.slots, chalice?.slots);
  const deepRows = hasDeep ? renderSlots(build.deepSlots, chalice?.deep) : [];

  // Collapsed summary: the slotted relics as a strip of icons (dimmed slot
  // icons for empty slots; Deep of Night icons after a divider).
  const iconStrip = (
    <span className="flex items-center gap-1">
      {build.slots.map((slot, i) => {
        const r = resolveSlot(slot, relicStore);
        return r ? (
          <RelicImg key={`n${i}`} src={r.icon} alt={r.name} size={22} />
        ) : (
          <span key={`n${i}`} className="opacity-35">
            <SlotIconImg color={chalice?.slots[i] ?? "White"} size={18} />
          </span>
        );
      })}
      {hasDeep && (
        <>
          <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
          {build.deepSlots.map((slot, i) => {
            const r = resolveSlot(slot, relicStore);
            return r ? (
              <span key={`d${i}`} title={`${r.name} (Deep of Night)`} className="opacity-70">
                <RelicImg src={r.icon} alt={r.name} size={22} />
              </span>
            ) : null;
          })}
        </>
      )}
    </span>
  );

  return (
    <article className="frame rounded-md bg-night-800 p-4">
      <div
        className={`flex items-start justify-between gap-2 ${expandable ? "cursor-pointer select-none" : ""}`}
        onClick={expandable ? () => setExpanded((e) => !e) : undefined}
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        onKeyDown={
          expandable
            ? (e) => {
                // Only the header itself — Enter on the inner buttons
                // shouldn't also toggle the card.
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded((x) => !x);
                }
              }
            : undefined
        }
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            {expandable && <Chevron open={expanded} />}
            <h4 className="min-w-0 truncate font-display font-semibold text-parchment">
              {build.name || "Unnamed build"}
            </h4>
          </div>
          {build.subtitle?.trim() && (
            <p className="font-body text-xs italic text-gold-dim">{build.subtitle}</p>
          )}
          <p className="font-body text-xs text-parchment-faint">
            {build.character} · {build.chalice}
          </p>
          {!expanded && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {iconStrip}
              {(build.tags?.length ?? 0) > 0 && (
                <span className="flex flex-wrap gap-1">
                  {build.tags!.map((t) => (
                    <span key={t} className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted">
                      {t}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}
          {/* Expanded: tags render below, on the grid's top row. */}
        </div>
        {onDelete && (
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {annotate && (
              <button
                type="button"
                onClick={() => setAnnotating((a) => !a)}
                aria-pressed={annotating}
                className={`rounded border px-2 py-0.5 font-body text-xs ${
                  annotating
                    ? "border-gold-dim text-gold-bright"
                    : "border-night-600 text-parchment-muted hover:text-gold-bright"
                }`}
              >
                Tags
              </button>
            )}
            <button type="button" onClick={share} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright">
              {copied ? "Copied ✓" : "Share"}
            </button>
            {onEdit && (
              <button type="button" onClick={onEdit} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright">Edit</button>
            )}
            <button type="button" onClick={onDelete} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300">Delete</button>
          </div>
        )}
      </div>
      {annotate && annotating && (
        <SharedBuildAnnotator
          build={build}
          registry={annotate.tags}
          onCreateTag={annotate.onCreateTag}
          onChange={annotate.onChange}
          onDone={() => setAnnotating(false)}
        />
      )}
      {/* Mobile-only view toggle — the stacked sections mean a lot of
          scrolling on small screens, so show one set at a time there. */}
      {expanded && hasDeep && (
        <div className="mt-3 flex items-center gap-1 sm:hidden">
          {(["normal", "deep"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                view === v
                  ? "bg-night-700 text-gold-bright"
                  : "bg-night-900 text-parchment-muted hover:text-parchment"
              }`}
            >
              {v === "normal" ? "Normal" : "Deep of Night"}
            </button>
          ))}
        </div>
      )}
      {/* Desktop: a two-column grid — tags and the Deep of Night header share
          the top row, then each row pairs a normal slot with its deep
          neighbor so the two sets stay lined up. Mobile: the toggle above
          picks which set shows. */}
      {expanded && (
      <div className={`mt-3 ${hasDeep ? "sm:grid sm:grid-cols-2 sm:gap-x-3" : ""}`}>
        <div>
          {(build.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 pb-2">
              {build.tags!.map((t) => (
                <span key={t} className="rounded border border-night-600 bg-night-900 px-2 py-0.5 font-body text-xs text-parchment">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {hasDeep && (
          <p
            className={`eyebrow pb-2 text-gold-dim sm:border-l sm:border-night-700 sm:pl-4 ${
              view === "normal" ? "hidden sm:block" : ""
            }`}
          >
            Deep of Night
          </p>
        )}
        {[0, 1, 2].map((i) => (
          <Fragment key={i}>
            <div className={`${i < 2 ? "pb-4" : ""} ${view === "deep" ? "hidden sm:block" : ""}`}>
              {normalRows[i]}
            </div>
            {hasDeep && (
              <div
                className={`${i < 2 ? "pb-4" : ""} sm:border-l sm:border-night-700 sm:pl-4 ${
                  view === "normal" ? "hidden sm:block" : ""
                }`}
              >
                {deepRows[i]}
              </div>
            )}
          </Fragment>
        ))}
      </div>
      )}
    </article>
  );
}

/**
 * Inline annotation panel for a shared (view-only) build: your own subtitle
 * and tags, saved locally onto the build without touching its relics — the
 * friend's build stays exactly as shared, and neither label travels if you
 * re-share it.
 */
function SharedBuildAnnotator({
  build,
  registry,
  onCreateTag,
  onChange,
  onDone,
}: {
  build: Build;
  registry: string[];
  onCreateTag: (name: string) => void;
  onChange: (patch: Partial<Pick<Build, "tags" | "subtitle">>) => void;
  onDone: () => void;
}) {
  const [newTag, setNewTag] = useState("");
  // Create the tag in the registry and put it on this build in one step.
  const addNewTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    onCreateTag(tag);
    onChange({ tags: sortedTags([...(build.tags ?? []), tag]) });
    setNewTag("");
  };
  return (
    <div className="mt-3 rounded-md border border-night-600 bg-night-900/60 p-3">
      <p className="font-body text-xs text-parchment-faint">
        Your own labels for this build — a subtitle for poorly named shares, and tags for
        grouping (by friend, by purpose). Saved on your device only.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={build.subtitle ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Subtitle (e.g. who it's from, what it's for)"
          className="frame w-72 max-w-full rounded bg-night-900 px-2 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        {registry.length > 0 && (
          <MultiSelect
            values={build.tags ?? []}
            options={registry.map((t) => ({ value: t, label: t }))}
            onChange={(tags) => onChange({ tags: sortedTags(tags) })}
            placeholder="Tags"
            className="w-44"
            showValues
          />
        )}
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewTag();
            }
          }}
          placeholder="New tag"
          className="frame w-32 rounded bg-night-900 px-2 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={addNewTag}
          disabled={!newTag.trim()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          + Add tag
        </button>
        <button
          type="button"
          onClick={onDone}
          className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}
