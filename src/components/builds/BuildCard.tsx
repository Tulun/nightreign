"use client";

// ─────────────────────────────────────────────────────────────────────────
//  List-view card for one saved build.
// ─────────────────────────────────────────────────────────────────────────

import { Fragment, useState } from "react";
import { type Build, type BuildStore, type SlotTriple } from "@/lib/builds";
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
 * One saved build. With onDelete it's an interactive card (Delete, plus Edit
 * when onEdit is given); with neither it's a read-only preview (community
 * profiles, party views). `expandable` cards start collapsed to a one-line
 * summary (relic icons + tags) and expand on click.
 */
export function BuildCard({
  build,
  store,
  onEdit,
  onDelete,
  expandable = false,
}: {
  build: Build;
  store: BuildStore;
  onEdit?: () => void;
  onDelete?: () => void;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(!expandable);
  // Mobile-only: which slot set the card shows (desktop always shows both).
  const [view, setView] = useState<"normal" | "deep">("normal");
  const chalice = chalicesFor(build.character).find((c) => c.name === build.chalice);
  const hasDeep = build.deepSlots.some(Boolean);
  // Party-member snapshots carry their own relics; slots resolve against
  // those, not the user's pool.
  const relicStore = build.relics?.length
    ? { ...store, customRelics: [...store.customRelics, ...build.relics] }
    : store;

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
            {onEdit && (
              <button type="button" onClick={onEdit} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright">Edit</button>
            )}
            <button type="button" onClick={onDelete} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300">Delete</button>
          </div>
        )}
      </div>
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
