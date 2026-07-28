"use client";

// ─────────────────────────────────────────────────────────────────────────
//  My Relics tab: the user's custom relic pool — filter, search, create,
//  edit in place, and import from a screenshot.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  RELIC_LOOKS,
  customRelicIcon,
  effectiveLook,
  relicLookIcon,
  sameCustomRelic,
  type CustomRelic,
} from "@/lib/builds";
import {
  EMPTY_QUERY,
  describeQuery,
  isEmptyQuery,
  matchesQuery,
  withKnownTags,
  type FilterQuery,
} from "@/lib/filterQuery";
import { CustomRelicEditor } from "./CustomRelicEditor";
import { FilterPanel, FilterToggle } from "./FilterPanel";
import { ScreenshotPoolImport } from "./ScreenshotImport";
import { TagManager } from "./TagManager";
import { TagPicker } from "./TagPicker";
import {
  RELIC_COLORS,
  EffectLines,
  IconButton,
  PencilIcon,
  RelicImg,
  RelicLineInputs,
  SlotIconImg,
  TrashIcon,
} from "./shared";

const COLOR_ORDER: Record<CustomRelic["color"], number> = { Red: 0, Blue: 1, Green: 2, Yellow: 3 };

export function MyRelics({
  relics,
  onAdd,
  onUpdate,
  onDelete,
  tagRegistry,
  onTagsChange,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: {
  relics: CustomRelic[];
  onAdd: (r: CustomRelic) => void;
  onUpdate: (r: CustomRelic) => void;
  onDelete: (id: string) => void;
  /** The relic keyword registry — its own list, separate from build tags. */
  tagRegistry: string[];
  onTagsChange: (id: string, tags: string[]) => void;
  onCreateTag: (tag: string) => void;
  onRenameTag: (from: string, to: string) => void;
  onDeleteTag: (tag: string) => void;
}) {
  const [colorFilter, setColorFilter] = useState<CustomRelic["color"] | null>(null);
  const [kindFilter, setKindFilter] = useState<"normal" | "deep" | null>(null);
  const [query, setQuery] = useState<FilterQuery>(EMPTY_QUERY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // A tag the registry has lost stops filtering, rather than quietly hiding
  // every relic (same rule the build list follows).
  useEffect(() => {
    setQuery((q) => withKnownTags(q, tagRegistry));
  }, [tagRegistry]);

  // The creation modal — the same editor slots use, with free color and a
  // Normal/Deep choice since no slot dictates them here.
  const creator = creating && (
    <CustomRelicEditor
      slotColor="White"
      deep={false}
      allowKindChoice
      onSave={(relic) => {
        // A duplicate would be unreachable noise — one pool entry covers it.
        if (relics.some((r) => sameCustomRelic(r, relic))) {
          window.alert("An identical relic is already in your pool.");
          return;
        }
        onAdd(relic);
        setCreating(false);
      }}
      onCancel={() => setCreating(false)}
    />
  );

  const newRelicButton = (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
    >
      + New relic
    </button>
  );

  if (relics.length === 0) {
    return (
      <div>
        <p className="font-body text-sm text-parchment-faint">
          No custom relics yet — create one here, add one while editing a build (&ldquo;+ Add
          new relic&rdquo; in any slot), or import from a screenshot.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {newRelicButton}
          <ScreenshotPoolImport relics={relics} onAdd={onAdd} />
        </div>
        {creator}
      </div>
    );
  }

  // The relic being edited stays on screen whatever the filters say — an open
  // editor holding unsaved edits shouldn't vanish because the filters moved
  // under it. Filtering catches up once the editor closes.
  const shown = relics
    .filter(
      (r) =>
        r.id === editingId ||
        ((!colorFilter || r.color === colorFilter) &&
          (!kindFilter || (kindFilter === "deep") === !!r.deep) &&
          matchesQuery(query, {
            labels: [r.name || `${r.color} relic`],
            effects: [...r.effects, ...(r.demerits ?? [])],
            tags: r.tags ?? [],
          })),
    )
    // Color, then normal before Deep of Night, then by name.
    .sort(
      (a, b) =>
        COLOR_ORDER[a.color] - COLOR_ORDER[b.color] ||
        Number(!!a.deep) - Number(!!b.deep) ||
        (a.name || "z").localeCompare(b.name || "z"),
    );

  // One section per relic color, in slot order — the pool reads as the four
  // colors rather than one long run of cards.
  const groups = RELIC_COLORS.map((color) => ({
    color,
    relics: shown.filter((r) => r.color === color),
  })).filter((g) => g.relics.length > 0);

  const relicCard = (r: CustomRelic) =>
    editingId === r.id ? (
      <RelicCardEditor
        key={r.id}
        relic={r}
        onSave={(edited) => {
          onUpdate(edited);
          setEditingId(null);
        }}
        onCancel={() => setEditingId(null)}
      />
    ) : (
      <div key={r.id} className="frame flex items-start gap-2.5 rounded-md bg-night-800 p-3">
        <RelicImg src={customRelicIcon(r)} alt={r.color} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate font-body text-base font-semibold text-parchment">
              {r.name || `${r.color} relic`}
              {r.deep && (
                <span className="ml-1.5 rounded border border-gold-dim/40 px-1 py-px align-middle font-body text-xs font-normal uppercase tracking-wide text-gold-dim">
                  Deep
                </span>
              )}
            </p>
            <div className="flex shrink-0 gap-1">
              <IconButton label="Edit relic" onClick={() => setEditingId(r.id)}>
                <PencilIcon />
              </IconButton>
              <IconButton label="Delete relic" danger onClick={() => onDelete(r.id)}>
                <TrashIcon />
              </IconButton>
            </div>
          </div>
          <EffectLines
            divided
            size="base"
            className="mt-1.5"
            lines={r.effects
              .map((text, i) => ({ text, demerit: r.demerits?.[i]?.trim() || undefined }))
              .filter((l) => l.text.trim())}
          />
          {/* Keywords, editable here — a relic is filed while you're looking
              at it, not through an editor. */}
          <div className="mt-2">
            <TagPicker
              values={r.tags ?? []}
              registry={tagRegistry}
              onChange={(tags) => onTagsChange(r.id, tags)}
              onCreate={onCreateTag}
              subject={r.name || `${r.color} relic`}
            />
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <p className="font-body text-xs text-parchment-faint">
        Custom relics you&rsquo;ve added — usable in any build with a matching slot.
      </p>
      {/* Creation actions on their own row — parse results render full-width
          beneath them without disturbing the filter row. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {newRelicButton}
        <ScreenshotPoolImport relics={relics} onAdd={onAdd} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setColorFilter(null)}
          aria-pressed={colorFilter === null}
          className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
            colorFilter === null ? "bg-night-700 text-gold-bright" : "bg-night-800 text-parchment-muted hover:text-parchment"
          }`}
        >
          All
        </button>
        {RELIC_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColorFilter(colorFilter === c ? null : c)}
            aria-pressed={colorFilter === c}
            className={`frame flex items-center gap-1 rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              colorFilter === c ? "bg-night-700 text-gold-bright" : "bg-night-800 text-parchment-muted hover:text-parchment"
            }`}
          >
            <SlotIconImg color={c} size={14} />
            {c}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
        {(["normal", "deep"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindFilter(kindFilter === k ? null : k)}
            aria-pressed={kindFilter === k}
            className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              kindFilter === k ? "bg-night-700 text-gold-bright" : "bg-night-800 text-parchment-muted hover:text-parchment"
            }`}
          >
            {k === "normal" ? "Normal" : "Deep"}
          </button>
        ))}
        <input
          type="text"
          value={query.text}
          onChange={(e) => setQuery((q) => ({ ...q, text: e.target.value }))}
          placeholder="Search relics, effects or tags…"
          aria-label="Search relics, effects or tags"
          className="frame w-64 max-w-full rounded-md bg-night-900 px-2.5 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint"
        />
        <FilterToggle query={query} open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} />
        <button
          type="button"
          onClick={() => setManagingTags((m) => !m)}
          aria-pressed={managingTags}
          className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
            managingTags
              ? "bg-night-700 text-gold-bright"
              : "bg-night-800 text-parchment-muted hover:text-parchment"
          }`}
        >
          Manage tags
        </button>
      </div>
      {filtersOpen && (
        <div className="mt-3">
          <FilterPanel
            query={query}
            onChange={setQuery}
            tags={tagRegistry}
            noun="relic"
            onManageTags={() => setManagingTags(true)}
          />
        </div>
      )}
      {!isEmptyQuery(query) && (
        <p className="mt-2 font-body text-xs text-parchment-faint">
          Showing relics{" "}
          <span className="text-parchment-muted">{describeQuery(query).join(", ")}</span>.
        </p>
      )}
      {managingTags && (
        <div className="mt-3">
          <TagManager
            tags={tagRegistry}
            noun="relic"
            usage={(tag) => relics.filter((r) => r.tags?.includes(tag)).length}
            onCreate={onCreateTag}
            onRename={onRenameTag}
            onDelete={onDeleteTag}
          />
        </div>
      )}
      {shown.length === 0 && (
        <p className="mt-3 font-body text-xs text-parchment-faint">No relics match.</p>
      )}
      <div className="mt-3 space-y-5">
        {groups.map((g) => (
          <section key={g.color}>
            <h4 className="eyebrow mb-2 flex items-center gap-1.5 border-b border-night-700 pb-1.5 text-gold-dim">
              <SlotIconImg color={g.color} size={14} />
              {g.color}
              <span className="font-body text-xs normal-case tracking-normal text-parchment-faint">
                {g.relics.length}
              </span>
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {g.relics.map(relicCard)}
            </div>
          </section>
        ))}
      </div>
      {creator}
    </div>
  );
}

/**
 * In-place editor for a pool relic: name, color, and each effect line. Edits
 * live in a draft until Save (or Enter) commits them — keystrokes used to
 * write straight through to the stored pool, so a refresh mid-edit kept
 * half-typed lines and cleared effects the user hadn't committed to.
 */
function RelicCardEditor({
  relic,
  onSave,
  onCancel,
}: {
  relic: CustomRelic;
  onSave: (r: CustomRelic) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(relic);
  const onUpdate = setDraft;

  return (
    <form
      className="frame rounded-md border-night-500 bg-night-800 p-3"
      onSubmit={(e) => {
        // Enter in any of the text inputs submits — the editor's inner
        // buttons are all type="button", so only Save gets here.
        e.preventDefault();
        onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onUpdate({ ...draft, name: e.target.value })}
          placeholder="Relic name"
          className="frame w-full rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <select
          value={draft.color}
          onChange={(e) => onUpdate({ ...draft, color: e.target.value as CustomRelic["color"] })}
          className="frame rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment"
        >
          {RELIC_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {/* Normal vs Deep decides which slots the draft fits. Going normal
          drops demerits — only Deep relics carry them. */}
      <div className="mt-2 flex items-center gap-1.5">
        {([false, true] as const).map((isDeep) => (
          <button
            key={String(isDeep)}
            type="button"
            onClick={() =>
              onUpdate(
                isDeep
                  ? { ...draft, deep: true }
                  : { ...draft, deep: false, demerits: draft.effects.map(() => "") },
              )
            }
            aria-pressed={!!draft.deep === isDeep}
            className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              !!draft.deep === isDeep
                ? "bg-night-700 text-gold-bright"
                : "bg-night-900 text-parchment-muted hover:text-parchment"
            }`}
          >
            {isDeep ? "Deep of Night" : "Normal"}
          </button>
        ))}
      </div>
      {/* Relic picture — the color's scene image in the chosen look. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onUpdate({ ...draft, look: undefined })}
          aria-pressed={!draft.look}
          title="Size by effect count (1 line small, 3 lines large)"
          className={`rounded-md border px-2 py-1 font-body text-xs transition-colors ${
            !draft.look
              ? "border-gold-bright bg-night-700 text-gold-bright"
              : "border-night-600 bg-night-900 text-parchment-muted hover:border-night-400"
          }`}
        >
          Auto
        </button>
        {RELIC_LOOKS.map((look) => {
          const active = effectiveLook(draft) === look;
          return (
            <button
              key={look}
              type="button"
              onClick={() => onUpdate({ ...draft, look })}
              aria-pressed={active}
              title={look.replace("-", " ")}
              className={`rounded-md border p-1 transition-colors ${
                active ? "border-gold-bright bg-night-700" : "border-night-600 bg-night-900 hover:border-night-400"
              }`}
            >
              <RelicImg src={relicLookIcon(draft.color, look)} alt={look} size={28} />
            </button>
          );
        })}
      </div>
      <RelicLineInputs relic={draft} onUpdate={onUpdate} className="mt-2" showDemerits={!!draft.deep} />
      <div className="mt-2 flex items-center gap-1.5">
        <button type="submit" className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600">
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="frame rounded-md bg-night-900 px-3 py-1 font-body text-xs text-parchment-muted hover:text-parchment"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
