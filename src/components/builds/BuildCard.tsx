"use client";

// ─────────────────────────────────────────────────────────────────────────
//  List-view card for one saved build.
// ─────────────────────────────────────────────────────────────────────────

import { Fragment, useState } from "react";
import Link from "next/link";
import { variantAt, variantCount, variantLabel, type Build, type BuildStore, type SlotTriple } from "@/lib/builds";
import { loadoutEffectStates } from "@/lib/effectCompat";
import { chalicesFor, resolveSlot, EffectLines, RelicImg, SlotIconImg } from "./shared";
import { TagPicker } from "./TagPicker";

/** Disclosure chevron for expandable build cards. */
function Chevron({ open, className = "text-parchment-faint" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${className} ${open ? "rotate-90" : ""}`}
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
 * Where an unfilled slot's picture would go: nothing but the relic art's
 * width, so the empty row's text still starts in the same column as its
 * neighbours' — a framed box there reads as a picture that failed to load.
 */
function EmptySlotImg({ size = 48 }: { size?: number }) {
  return <span className="block shrink-0" style={{ width: size }} aria-hidden="true" />;
}

/** Pencil / trash glyphs for the tile's Edit and Delete actions. */
function ActionIcon({ kind }: { kind: "edit" | "delete" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "edit" ? (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      ) : (
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </>
      )}
    </svg>
  );
}

/**
 * One saved build. With onDelete it's an interactive card (Delete, plus Edit
 * when onEdit is given); with neither it's a
 * read-only preview (community profiles, party views). `expandable` cards
 * start collapsed to a one-line summary (relic icons + tags) and expand on
 * click; with `href` the whole card is a link into the build's own page —
 * carrying the actions alongside the link, if it was given any — and with
 * `onOpen` it's a grid tile that opens the build in place.
 *
 * The variant tabs are the card's own business unless `variantIdx` is given,
 * which hands that choice to the caller — the build's own page keeps it in
 * the URL so a single loadout can be linked (see buildPath).
 */
export function BuildCard({
  build,
  store,
  href,
  onOpen,
  onEdit,
  onDelete,
  expandable = false,
  defaultExpanded = false,
  nightView,
  variantIdx,
  onVariantChange,
  tagRegistry,
  onTagsChange,
  onCreateTag,
}: {
  build: Build;
  store: BuildStore;
  /** Link into this build's own page — makes the card a click-through. */
  href?: string;
  /** Same idea as `href`, for views that open the build without a route. */
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  expandable?: boolean;
  /** Start an expandable card open — for views that are about the relics. */
  defaultExpanded?: boolean;
  /**
   * Which slot set to show, when the caller owns that choice: the card then
   * shows one set at a time at every width, single-column, and its own
   * toggle steps aside. Party columns are too narrow for the side-by-side
   * grid, and there the choice belongs to the party, not to one member.
   */
  nightView?: "normal" | "deep";
  /** Which loadout to show, when the caller owns that choice. */
  variantIdx?: number;
  /** Told which tab was clicked — with or without `variantIdx`. */
  onVariantChange?: (i: number) => void;
  /**
   * The tag registry to pick from. With `onTagsChange` as well, the card's
   * tags become editable in place — the grid tile is where builds are
   * actually organized, and a tag shouldn't mean opening the editor.
   */
  tagRegistry?: string[];
  onTagsChange?: (tags: string[]) => void;
  /** Adds a name to the registry — for tags invented on the card. */
  onCreateTag?: (tag: string) => void;
}) {
  const [expanded, setExpanded] = useState(!expandable || defaultExpanded);
  // Mobile-only: which slot set the card shows (desktop shows both, unless
  // the caller has taken that choice over with nightView).
  const [ownView, setOwnView] = useState<"normal" | "deep">("normal");
  const single = nightView !== undefined;
  const view = nightView ?? ownView;
  // A set the card isn't showing: gone entirely when only one shows at a
  // time, otherwise gone on mobile and back on the desktop two-column grid.
  const hideUnless = (set: "normal" | "deep") =>
    view === set ? "" : single ? "hidden" : "hidden sm:block";
  // Two-column separators belong to the grid; single-column has no left edge
  // to draw against.
  const deepRule = single ? "" : "sm:border-l sm:border-night-700 sm:pl-4";
  // Which loadout variant the card shows — builds can carry a few takes on
  // the same idea, tabbed through here. A controlled variantIdx wins, and
  // then the tabs only report the click; the caller does the switching.
  const [ownVariant, setOwnVariant] = useState(0);
  const variants = variantCount(build);
  const vi = Math.max(0, Math.min(variantIdx ?? ownVariant, variants - 1));
  const pickVariant = (i: number) => {
    if (variantIdx === undefined) setOwnVariant(i);
    onVariantChange?.(i);
  };
  const loadout = variantAt(build, vi);
  const chalice = chalicesFor(build.character).find((c) => c.name === loadout.chalice);
  // The expanded card always draws both slot sets — a vessel has its three
  // Deep of Night slots whether or not this build fills them, and drawing
  // them empty (as the game does) beats a half-width card that reads as
  // something failing to render. hasDeep is still what decides where the
  // *relics* matter: the line pitch, the mobile toggle, the icon strip.
  const hasDeep = loadout.deepSlots.some(Boolean);
  // Party-member snapshots carry their own relics; slots resolve against
  // those, not the user's pool.
  const relicStore = build.relics?.length
    ? { ...store, customRelics: [...store.customRelics, ...build.relics] }
    : store;

  // Each row pads its shorter slot out to its neighbour's effect count, so a
  // 2-effect relic beside a 3-effect one gains a dashed row instead of the
  // two blocks ending at different heights. Equal counts pad nothing.
  // An unfilled slot counts as a relic's full three effect rows — every empty
  // slot then shows the same three dashes, whatever sits beside it, instead of
  // a row of two empties collapsing to a bare label.
  const lineCount = (slot: SlotTriple[number]) => resolveSlot(slot, relicStore)?.lines.length ?? 3;
  const rowLines = [0, 1, 2].map((i) =>
    Math.max(lineCount(loadout.slots[i]), lineCount(loadout.deepSlots[i])),
  );

  // Which of the loadout's effects actually land on this Nightfarer, worked
  // out per set: the Deep of Night slots are the same three sockets on a Deep
  // expedition, so a normal relic never overrides a Deep one.
  const renderSlots = (slots: SlotTriple) => {
    const states = loadoutEffectStates(
      build.character,
      slots.map((slot) => (resolveSlot(slot, relicStore)?.lines ?? []).map((l) => l.text)),
    );
    return slots.map((slot, i) => {
      const resolved = resolveSlot(slot, relicStore);
      return (
        <div key={i} className="flex items-start gap-3">
          {resolved ? (
            <>
              <RelicImg src={resolved.icon} alt={resolved.name} size={48} />
              <div className="min-w-0">
                <p className="font-body text-base text-parchment">{resolved.name}</p>
                {/* spread + pad: every row runs at the pitch of an effect with
                    a demerit under it, and short slots gain dashed rows, so a
                    normal slot and its Deep of Night neighbour read as one
                    block. Only where the card shows both (hasDeep), never
                    where it shows one set at a time — there they'd only be
                    height, and a party column has none to spare. */}
                <EffectLines
                  lines={resolved.lines}
                  states={states[i]}
                  size="sm"
                  className="mt-0.5 space-y-0.5"
                  spread={hasDeep && !single}
                  pad={single ? 0 : rowLines[i]}
                />
              </div>
            </>
          ) : (
            /* Same shape as a filled slot — picture, name line, effect rows —
               so an unfilled slot reads as an empty slot rather than a gap. */
            <>
              <EmptySlotImg size={48} />
              <div className="min-w-0">
                <p className="font-body text-base text-parchment-faint">Empty slot</p>
                <EffectLines
                  lines={[]}
                  size="sm"
                  className="mt-0.5 space-y-0.5"
                  spread={hasDeep && !single}
                  pad={single ? 0 : rowLines[i]}
                />
              </div>
            </>
          )}
        </div>
      );
    });
  };
  const normalRows = renderSlots(loadout.slots);
  const deepRows = renderSlots(loadout.deepSlots);

  // The vessel's six slot colors, normal then Deep of Night — a header-line
  // summary of what the build's chalice can take, so the slot rows below stay
  // about the relics.
  const slotLegend = chalice && (
    <span className="hidden shrink-0 items-center gap-1 sm:flex" title="Vessel slots — normal, then Deep of Night">
      {chalice.slots.map((c, i) => (
        <SlotIconImg key={`n${i}`} color={c} size={17} />
      ))}
      <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
      {chalice.deep.map((c, i) => (
        <span key={`d${i}`} className="opacity-70">
          <SlotIconImg color={c} size={17} />
        </span>
      ))}
    </span>
  );

  // Which slot sets the collapsed strip summarises. A full-width card shows
  // both, Deep of Night after a divider. A party column (single) shows only
  // the set on show: six icons at strip size take the whole column, and a
  // collapsed card that has traded its name and vessel away for a second row
  // of relics has given up the part that says *which build this is*.
  const stripSets: ("normal" | "deep")[] = single ? [view] : hasDeep ? ["normal", "deep"] : ["normal"];

  // Collapsed summary: the slotted relics as a strip of icons (dimmed slot
  // icons for empty slots).
  const iconStrip = (size: number, gap = "gap-1") => (
    <span className={`flex items-center ${gap}`}>
      {stripSets.map((set, si) => (
        <Fragment key={set}>
          {si > 0 && <span className="mx-1 w-px self-stretch bg-night-600" aria-hidden="true" />}
          {(set === "deep" ? loadout.deepSlots : loadout.slots).map((slot, i) => {
            const r = resolveSlot(slot, relicStore);
            const color = (set === "deep" ? chalice?.deep[i] : chalice?.slots[i]) ?? "White";
            return r ? (
              /* Deep relics read dimmer than normal ones only where both are
                 on show — alone in a party column there's nothing to rank
                 them against, and dimming would just make the strip murky. */
              <span
                key={`${set}${i}`}
                title={set === "deep" ? `${r.name} (Deep of Night)` : undefined}
                className={set === "deep" && !single ? "opacity-70" : ""}
              >
                <RelicImg src={r.icon} alt={r.name} size={size} />
              </span>
            ) : (
              <span key={`${set}${i}`} className="opacity-35">
                <SlotIconImg color={color} size={size - 4} />
              </span>
            );
          })}
        </Fragment>
      ))}
    </span>
  );

  // Tagging in place, where the card was given the means to do it.
  const editableTags = onTagsChange && tagRegistry && (
    <TagPicker
      values={build.tags ?? []}
      registry={tagRegistry}
      onChange={onTagsChange}
      onCreate={onCreateTag ?? (() => {})}
      subject={build.name || "this build"}
    />
  );

  const tagChips = (build.tags?.length ?? 0) > 0 && (
    <span className="flex flex-wrap gap-1">
      {build.tags!.map((t) => (
        <span key={t} className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted">
          {t}
        </span>
      ))}
    </span>
  );

  // Grid tile: the whole card opens the build's own view, with Edit and
  // Delete as glyphs in the corner so several tiles fit across a row. The
  // click target is an overlay behind the content (which stays inert) —
  // that keeps the action buttons out of a nested-button situation.
  if (onOpen) {
    return (
      <article className="frame group relative flex min-w-0 flex-col rounded-md bg-night-800 p-4 transition-colors hover:bg-night-700">
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 rounded-md"
          aria-label={`Open ${build.name || "Unnamed build"}`}
        />
        <div className="pointer-events-none relative flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-display text-lg font-semibold text-parchment transition-colors group-hover:text-gold-bright">
              {build.name || "Unnamed build"}
            </h4>
            <p className="truncate font-body text-sm text-parchment-faint">
              {build.character} · {build.chalice}
              {variants > 1 && ` · ${variants} variants`}
            </p>
          </div>
          {(onEdit || onDelete) && (
            <div className="pointer-events-auto flex shrink-0 gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="Edit build"
                  aria-label={`Edit ${build.name || "Unnamed build"}`}
                  className="rounded border border-night-600 p-1.5 text-parchment-muted transition-colors hover:border-gold-dim hover:text-gold-bright"
                >
                  <ActionIcon kind="edit" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  title="Delete build"
                  aria-label={`Delete ${build.name || "Unnamed build"}`}
                  className="rounded border border-night-600 p-1.5 text-parchment-muted transition-colors hover:border-red-400/60 hover:text-red-300"
                >
                  <ActionIcon kind="delete" />
                </button>
              )}
            </div>
          )}
        </div>
        {/* Tags sit between the title and the relics, and the relic strip is
            pushed to the card's floor (mt-auto) rather than following them:
            grid rows stretch every tile to the tallest, so an untagged tile
            takes the gap instead of riding its strip up out of line with its
            neighbours'. Two rows of tags on one card can't drag the rest of
            the row out of alignment either. */}
        {/* w-fit is load-bearing: this row sits above the open-overlay and,
            when the tags are editable, takes pointer events. Full-width it
            would swallow every click in its band — including the empty space
            past the last chip, which looks like ordinary card background and
            so reads as the card simply not opening. */}
        {(editableTags || tagChips) && (
          <div
            className={`relative mt-2 flex w-fit max-w-full ${
              editableTags ? "" : "pointer-events-none"
            }`}
          >
            {editableTags || tagChips}
          </div>
        )}
        <div className="pointer-events-none relative mt-auto flex pt-3">{iconStrip(38, "gap-1.5")}</div>
      </article>
    );
  }

  // Link card: the whole tile navigates to the build's own page, so it never
  // expands in place and the arrow sits on the trailing edge (a leading
  // chevron would read as a disclosure triangle it isn't).
  if (href) {
    // Actions on a link card (your own build, listed on your community
    // profile) can't sit *inside* the link — a button in an anchor is neither
    // valid nor clickable — so the link becomes an overlay behind the content
    // and the buttons, being positioned, stay on top of it.
    const actions = (onEdit || onDelete) && (
      <span className="relative flex shrink-0 gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Edit build"
            aria-label={`Edit ${build.name || "Unnamed build"}`}
            className="rounded border border-night-600 p-1.5 text-parchment-muted transition-colors hover:border-gold-dim hover:text-gold-bright"
          >
            <ActionIcon kind="edit" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Delete build"
            aria-label={`Delete ${build.name || "Unnamed build"}`}
            className="rounded border border-night-600 p-1.5 text-parchment-muted transition-colors hover:border-red-400/60 hover:text-red-300"
          >
            <ActionIcon kind="delete" />
          </button>
        )}
      </span>
    );
    // Title above the relics rather than beside them — the same shape as the
    // Builds page tile. Side by side, half a grid row had to seat a name, six
    // relics, the actions and the arrow: the strip and the buttons hold their
    // width, so the name was what gave, and cards read as "Nap ti…". Stacked,
    // it has the card's full width at every size and never truncates.
    // min-w-0, as on the tile above: a grid item won't shrink under its own
    // min-content, and a card whose title is one nowrap line *is* that wide —
    // so on a phone the cards stood proud of the screen instead of truncating
    // the name they were given `truncate` for.
    return (
      <article className="frame group relative flex min-w-0 flex-col rounded-md bg-night-800 p-4 transition-colors hover:bg-night-700">
        <Link
          href={href}
          className="absolute inset-0 rounded-md"
          aria-label={`Open ${build.name || "Unnamed build"}`}
        />
        <div className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-lg font-semibold text-parchment transition-colors group-hover:text-gold-bright">
              {build.name || "Unnamed build"}
            </span>
            <span className="block truncate font-body text-sm text-parchment-faint">
              {build.character} · {build.chalice}
              {variants > 1 && ` · ${variants} variants`}
            </span>
          </span>
          {actions}
          <span className="shrink-0 pt-1.5 text-parchment-faint transition-colors group-hover:text-gold-bright">
            <Chevron open={false} className="" />
          </span>
        </div>
        {tagChips && <div className="mt-2 flex">{tagChips}</div>}
        {/* mt-auto, as on the Builds tile: grid rows stretch every card to the
            tallest, so an untagged card takes the slack above its strip rather
            than riding it up out of line with its neighbours'. */}
        <div className="mt-auto flex pt-3">{iconStrip(38, "gap-1.5")}</div>
      </article>
    );
  }

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
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {expandable && <Chevron open={expanded} />}
            <h4 className="min-w-0 truncate font-display text-lg font-semibold text-parchment">
              {build.name || "Unnamed build"}
            </h4>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate font-body text-sm text-parchment-faint">
              {build.character} · {loadout.chalice}
            </p>
            {/* Desktop only — the slot colors belong beside the vessel that
                grants them, and a phone header has no room for six icons. */}
            {expanded && slotLegend}
          </div>
          {!expanded && (
            <>
              {tagChips && <div className="mt-2 flex">{tagChips}</div>}
              {/* Narrow screens have no room beside the title — the relics
                  drop under it instead, at a size that still fits. */}
              <div className="mt-2.5 flex sm:hidden">{iconStrip(30, "gap-1.5")}</div>
            </>
          )}
          {/* Expanded: tags render below, on the grid's top row. */}
        </div>
        {(onDelete || !expanded) && (
          <div className="flex shrink-0 flex-col items-end gap-2.5">
            {onDelete && (
              <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button type="button" onClick={onEdit} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright">Edit</button>
                )}
                {onDelete && (
                  <button type="button" onClick={onDelete} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300">Delete</button>
                )}
              </div>
            )}
            {/* Collapsed: the relics are the summary, so they get the width
                the title doesn't need — under the buttons, not beside them. */}
            {!expanded && <span className="hidden sm:flex">{iconStrip(44, "gap-2")}</span>}
          </div>
        )}
      </div>
      {/* Variant tabs — click through the build's loadouts. Rendered above
          the slot grid so comparing two takes is one click, not a scroll. */}
      {expanded && variants > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-1" role="group" aria-label="Build variants">
          {Array.from({ length: variants }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pickVariant(i)}
              aria-pressed={vi === i}
              className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                vi === i
                  ? "bg-night-700 text-gold-bright"
                  : "bg-night-900 text-parchment-muted hover:text-parchment"
              }`}
            >
              {/* 4ch floor so short labels ("V2") match the width of "Main". */}
              <span className="inline-block min-w-[4ch] text-center">{variantLabel(build, i)}</span>
            </button>
          ))}
        </div>
      )}
      {/* Mobile-only view toggle — the stacked sections mean a lot of
          scrolling on small screens, so show one set at a time there. With
          nightView the caller is already running a toggle of its own. */}
      {expanded && hasDeep && !single && (
        <div className="mt-3 flex items-center gap-1 sm:hidden">
          {(["normal", "deep"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setOwnView(v)}
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
          neighbor so the two sets stay lined up. Rows size to their own
          content: a grid row is as tall as its taller cell either way, so
          the pair still aligns. Mobile (and any nightView caller): the
          toggle above picks which set shows. */}
      {expanded && (
      <div
        className={`mt-3 ${
          single ? "" : "sm:grid sm:grid-cols-2 sm:grid-rows-[auto_repeat(3,auto)] sm:gap-x-3"
        }`}
      >
        <div>
          {editableTags ? (
            <div className="pb-2">{editableTags}</div>
          ) : (
            (build.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 pb-2">
                {build.tags!.map((t) => (
                  <span key={t} className="rounded border border-night-600 bg-night-900 px-2 py-0.5 font-body text-xs text-parchment">
                    {t}
                  </span>
                ))}
              </div>
            )
          )}
        </div>
        {/* Without deep relics there's no mobile toggle, so `view` stays
            "normal" and this whole side is desktop-only — a phone doesn't
            scroll past three empty slots. */}
        <p className={`eyebrow pb-2 text-gold-dim ${deepRule} ${hideUnless("deep")}`}>
          Deep of Night
        </p>
        {/* Tighter gaps on mobile: one set shows at a time there, so the
            slots only have to read as separate, not line up with anything. */}
        {[0, 1, 2].map((i) => (
          <Fragment key={i}>
            <div className={`${i < 2 ? "pb-3 sm:pb-4" : ""} ${hideUnless("normal")}`}>
              {normalRows[i]}
            </div>
            <div className={`${i < 2 ? "pb-3 sm:pb-4" : ""} ${deepRule} ${hideUnless("deep")}`}>
              {deepRows[i]}
            </div>
          </Fragment>
        ))}
      </div>
      )}
    </article>
  );
}
