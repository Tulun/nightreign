"use client";

// ─────────────────────────────────────────────────────────────────────────
//  My Relics tab: the user's custom relic pool — filter, search, create,
//  edit in place, and import from a screenshot.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  RELIC_LOOKS,
  customRelicIcon,
  effectiveLook,
  relicLookIcon,
  sameCustomRelic,
  type CustomRelic,
} from "@/lib/builds";
import { CustomRelicEditor } from "./CustomRelicEditor";
import { ScreenshotPoolImport } from "./ScreenshotImport";
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
}: {
  relics: CustomRelic[];
  onAdd: (r: CustomRelic) => void;
  onUpdate: (r: CustomRelic) => void;
  onDelete: (id: string) => void;
}) {
  const [colorFilter, setColorFilter] = useState<CustomRelic["color"] | null>(null);
  const [kindFilter, setKindFilter] = useState<"normal" | "deep" | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  const q = query.trim().toLowerCase();
  const shown = relics
    .filter((r) => !colorFilter || r.color === colorFilter)
    .filter((r) => !kindFilter || (kindFilter === "deep") === !!r.deep)
    .filter(
      (r) =>
        !q ||
        (r.name || `${r.color} relic`).toLowerCase().includes(q) ||
        r.effects.some((e) => e.toLowerCase().includes(q)) ||
        (r.demerits ?? []).some((e) => e.toLowerCase().includes(q)),
    )
    .sort((a, b) => COLOR_ORDER[a.color] - COLOR_ORDER[b.color] || (a.name || "z").localeCompare(b.name || "z"));

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search relics or effects…"
          className="frame w-64 max-w-full rounded-md bg-night-900 px-2.5 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint"
        />
      </div>
      {shown.length === 0 && (
        <p className="mt-3 font-body text-xs text-parchment-faint">No relics match.</p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) =>
          editingId === r.id ? (
            <RelicCardEditor key={r.id} relic={r} onUpdate={onUpdate} onDone={() => setEditingId(null)} />
          ) : (
            <div key={r.id} className="frame flex items-start gap-2.5 rounded-md bg-night-800 p-3">
              <RelicImg src={customRelicIcon(r)} alt={r.color} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-body text-sm font-semibold text-parchment">
                    {r.name || `${r.color} relic`}
                    {r.deep && (
                      <span className="ml-1.5 rounded border border-gold-dim/40 px-1 py-px align-middle font-body text-[10px] font-normal uppercase tracking-wide text-gold-dim">
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
                  className="mt-1.5"
                  lines={r.effects
                    .map((text, i) => ({ text, demerit: r.demerits?.[i]?.trim() || undefined }))
                    .filter((l) => l.text.trim())}
                />
              </div>
            </div>
          ),
        )}
      </div>
      {creator}
    </div>
  );
}

/** In-place editor for a pool relic: name, color, and each effect line. */
function RelicCardEditor({
  relic,
  onUpdate,
  onDone,
}: {
  relic: CustomRelic;
  onUpdate: (r: CustomRelic) => void;
  onDone: () => void;
}) {
  return (
    <div className="frame rounded-md border-night-500 bg-night-800 p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={relic.name}
          onChange={(e) => onUpdate({ ...relic, name: e.target.value })}
          placeholder="Relic name"
          className="frame w-full rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <select
          value={relic.color}
          onChange={(e) => onUpdate({ ...relic, color: e.target.value as CustomRelic["color"] })}
          className="frame rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment"
        >
          {RELIC_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {/* Normal vs Deep decides which slots the relic fits. Going normal
          drops demerits — only Deep relics carry them. */}
      <div className="mt-2 flex items-center gap-1.5">
        {([false, true] as const).map((isDeep) => (
          <button
            key={String(isDeep)}
            type="button"
            onClick={() =>
              onUpdate(
                isDeep
                  ? { ...relic, deep: true }
                  : { ...relic, deep: false, demerits: relic.effects.map(() => "") },
              )
            }
            aria-pressed={!!relic.deep === isDeep}
            className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              !!relic.deep === isDeep
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
          onClick={() => onUpdate({ ...relic, look: undefined })}
          aria-pressed={!relic.look}
          title="Size by effect count (1 line small, 3 lines large)"
          className={`rounded-md border px-2 py-1 font-body text-xs transition-colors ${
            !relic.look
              ? "border-gold-bright bg-night-700 text-gold-bright"
              : "border-night-600 bg-night-900 text-parchment-muted hover:border-night-400"
          }`}
        >
          Auto
        </button>
        {RELIC_LOOKS.map((look) => {
          const active = effectiveLook(relic) === look;
          return (
            <button
              key={look}
              type="button"
              onClick={() => onUpdate({ ...relic, look })}
              aria-pressed={active}
              title={look.replace("-", " ")}
              className={`rounded-md border p-1 transition-colors ${
                active ? "border-gold-bright bg-night-700" : "border-night-600 bg-night-900 hover:border-night-400"
              }`}
            >
              <RelicImg src={relicLookIcon(relic.color, look)} alt={look} size={28} />
            </button>
          );
        })}
      </div>
      <RelicLineInputs relic={relic} onUpdate={onUpdate} className="mt-2" showDemerits={!!relic.deep} />
      <button type="button" onClick={onDone} className="frame mt-2 rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600">
        Done
      </button>
    </div>
  );
}
