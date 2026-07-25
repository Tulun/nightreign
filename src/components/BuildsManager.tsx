"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { characterChalices, grailChalices } from "@/data/chalices";
import { Dropdown } from "@/components/Dropdown";
import { MultiSelect } from "@/components/MultiSelect";
import { asset } from "@/lib/assets";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  RELIC_LOOKS,
  customRelicIcon,
  decodeSharedBuild,
  effectiveLook,
  encodeSharedBuild,
  fixedRelics,
  fixedRelicsFor,
  loadStore,
  mergeStores,
  newId,
  normalizeStore,
  relicLookIcon,
  sameCustomRelic,
  saveStore,
  sortedTags,
  type Build,
  type BuildSlot,
  type BuildStore,
  type CustomRelic,
  type FixedRelicOption,
  type SharedBuild,
  type SlotTriple,
} from "@/lib/builds";
import { SLOT_ICON, type Chalice, type SlotColor } from "@/lib/chalices";
import {
  CURSE_VOCABULARY,
  DEEP_EFFECT_VOCABULARY,
  NORMAL_EFFECT_VOCABULARY,
  bestLineMatch,
  isCurseEffect,
  matchOcrLines,
  parseRelicGroups,
  type EffectMatch,
} from "@/lib/effectMatch";

const RELIC_COLORS: CustomRelic["color"][] = ["Red", "Blue", "Green", "Yellow"];

/** Everything clickable when creating a Deep relic: effects plus curses. */
const DEEP_CREATE_VOCABULARY = [...DEEP_EFFECT_VOCABULARY, ...CURSE_VOCABULARY].sort();

/** The datalist id for an effect input of the given relic kind. */
const effectListId = (deep: boolean) => (deep ? "effect-vocab-deep" : "effect-vocab-normal");

/**
 * Shared autocomplete lists for effect inputs — one per relic kind, so a
 * relic only ever suggests effects that can legally roll on it, plus the
 * curse list for demerit lines.
 */
function EffectDatalists() {
  return (
    <>
      <datalist id="effect-vocab-normal">
        {NORMAL_EFFECT_VOCABULARY.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      <datalist id="effect-vocab-deep">
        {DEEP_EFFECT_VOCABULARY.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      <datalist id="effect-vocab-curse">
        {CURSE_VOCABULARY.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
    </>
  );
}

/** Slot address within a build: normal or Deep of Night, index 0–2. */
type SlotRef = { deep: boolean; index: number };

/**
 * User builds, stored locally in the browser (no account, no server). The
 * list view shows saved builds per Nightfarer; the editor is a full-width
 * view with searchable relic pickers, Deep of Night slots, and a
 * whole-screenshot importer that fills slots from a photo.
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
  const importRef = useRef<HTMLInputElement>(null);

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

  if (!store) {
    return <p className="font-body text-sm text-parchment-faint">Loading saved builds…</p>;
  }

  const update = (fn: (s: BuildStore) => BuildStore) => {
    setStore((prev) => {
      const next = fn(prev ?? EMPTY_STORE);
      saveStore(next);
      return next;
    });
  };

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

  if (editing) {
    return (
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
    );
  }

  // Your own builds live in the Builds tab; view-only builds kept from
  // friends' share links get their own Shared Builds tab.
  const ownBuilds = store.builds.filter((b) => !b.shared);
  const sharedBuilds = store.builds
    .filter((b) => b.shared)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const builds = ownBuilds
    .filter((b) => !character || b.character === character)
    .filter(
      (b) =>
        tagFilter.length === 0 ||
        (tagMode === "any"
          ? tagFilter.some((t) => b.tags?.includes(t))
          : tagFilter.every((t) => b.tags?.includes(t))),
    )
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

  return (
    <div>
      {/* Builds / My Relics view switch */}
      <div className="mb-5 flex gap-1 border-b border-night-700">
        {(
          [
            { key: "builds", label: "Builds", count: ownBuilds.length },
            { key: "sharedBuilds", label: "Shared Builds", count: sharedBuilds.length },
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
          <div className="mt-3 max-w-2xl">
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
        {store.tags.length > 0 && (
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
        )}
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
          Saved in this browser only — export to back up or move devices.
        </span>
      </div>

      {/* Spell the tag filter out in words so the Match any/all choice is
          self-explanatory: "tagged Boss or Farm" vs "tagged Boss and Farm". */}
      {tagFilter.length > 0 && (
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
      )}

      {managingTags && (
        <TagManager
          tags={store.tags}
          usage={(tag) => ownBuilds.filter((b) => b.tags?.includes(tag)).length}
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
        <div className="grid gap-3 xl:grid-cols-2">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} store={store} onEdit={() => setEditing(b)} onDelete={() => deleteBuild(b.id)} />
          ))}
        </div>
      )}
        </>
      )}

      {view === "sharedBuilds" && (
        <>
          <p className="mb-5 font-body text-xs text-parchment-faint">
            Builds kept from friends&rsquo; share links — view only. Their relics stay out of
            your relic pool; delete a build to remove it.
          </p>
          {sharedBuilds.length === 0 ? (
            <p className="font-body text-sm text-parchment-faint">
              No shared builds yet — open a share link from a friend and choose
              &ldquo;Keep (view only)&rdquo;.
            </p>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {sharedBuilds.map((b) => (
                <BuildCard key={b.id} build={b} store={store} onDelete={() => deleteBuild(b.id)} />
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

// ── Shared helpers ───────────────────────────────────────────────────────

/** The chalices a character can equip: their own vessels plus the grails. */
function chalicesFor(character: string): Chalice[] {
  const own = characterChalices.find((c) => c.name === character)?.chalices ?? [];
  return [...own, ...grailChalices];
}

interface ResolvedLine {
  text: string;
  demerit?: string;
}

function resolveSlot(
  slot: BuildSlot,
  store: BuildStore,
): { name: string; color: SlotColor; icon: string; lines: ResolvedLine[] } | null {
  if (!slot) return null;
  if (slot.kind === "fixed") {
    const r = fixedRelics.find((f) => f.name === slot.name);
    return r
      ? { name: r.name, color: r.color, icon: r.icon, lines: r.effects.map((text) => ({ text })) }
      : null;
  }
  const r = store.customRelics.find((c) => c.id === slot.id);
  if (!r) return null;
  const lines = r.effects
    .map((text, i) => ({ text, demerit: r.demerits?.[i]?.trim() || undefined }))
    .filter((l) => l.text.trim());
  return { name: r.name || `${r.color} relic`, color: r.color, icon: customRelicIcon(r), lines };
}

/** Effect lines with their demerits, one per row. */
function EffectLines({
  lines,
  className,
  size = "xs",
  divided = false,
}: {
  lines: ResolvedLine[];
  className?: string;
  /** "sm" for reading surfaces (build cards); "xs" for dense pickers. */
  size?: "xs" | "sm";
  /** Rule between lines, so each effect reads separately at a glance. */
  divided?: boolean;
}) {
  return (
    <ul className={`${divided ? "divide-y divide-night-700" : ""} ${className ?? ""}`}>
      {lines.map((l, i) => (
        <li
          key={`${l.text}-${i}`}
          className={`font-body text-parchment-muted ${
            size === "sm" ? "text-sm leading-relaxed" : "text-xs leading-snug"
          } ${divided ? "py-1.5 first:pt-0 last:pb-0" : ""}`}
        >
          {l.text}
          {l.demerit && <span className="block pl-3 text-red-300/80">{l.demerit}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Compact square icon button (edit / delete on dense cards). */
function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded border border-night-600 text-parchment-muted transition-colors ${
        danger ? "hover:border-red-400/60 hover:text-red-300" : "hover:border-gold-faint hover:text-gold-bright"
      }`}
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** Infer a relic color from a scene name (Drizzly=Blue, Tranquil=Green in-game). */
function colorFromRelicName(name: string | null): CustomRelic["color"] | null {
  if (!name) return null;
  if (/burning/i.test(name)) return "Red";
  if (/drizzly/i.test(name)) return "Blue";
  if (/tranquil/i.test(name)) return "Green";
  if (/luminous/i.test(name)) return "Yellow";
  return null;
}

interface OcrLine {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

/** Run OCR on an image and return its text lines (with positions when available). */
async function ocrLines(file: File, onProgress: (status: string) => void): Promise<OcrLine[]> {
  onProgress("Loading OCR engine (downloads a few MB on first use)…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(`Reading screenshot… ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
  await worker.terminate();
  const lines: OcrLine[] = (data.blocks ?? []).flatMap((b) =>
    (b.paragraphs ?? []).flatMap((p) =>
      (p.lines ?? []).map((l) => ({ text: l.text ?? "", bbox: l.bbox ?? null })),
    ),
  );
  if (lines.length > 0) return lines;
  return data.text.split("\n").map((text) => ({ text, bbox: null }));
}

/**
 * Guess each parsed relic's color by sampling the image left of its first
 * effect line, where the relic icon glows in the relic's color. Best effort —
 * returns null wherever the icon region can't be located or read.
 */
async function guessGroupColors(
  file: File,
  groups: { firstLine: string | null; bbox: OcrLine["bbox"] }[],
): Promise<(CustomRelic["color"] | null)[]> {
  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return groups.map(() => null);
    ctx.drawImage(bmp, 0, 0);
    return groups.map((g) => {
      if (!g.bbox) return null;
      const lineH = Math.max(8, g.bbox.y1 - g.bbox.y0);
      const x0 = Math.max(0, g.bbox.x0 - lineH * 10);
      const width = Math.min(g.bbox.x0, lineH * 9);
      const y0 = Math.max(0, g.bbox.y0 - lineH);
      const height = Math.min(bmp.height - y0, lineH * 4);
      if (width < 8 || height < 8) return null;
      const pixels = ctx.getImageData(x0, y0, width, height).data;
      const counts = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
      let total = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i] / 255;
        const gch = pixels[i + 1] / 255;
        const b = pixels[i + 2] / 255;
        const max = Math.max(r, gch, b);
        const min = Math.min(r, gch, b);
        if (max < 0.2 || max - min < 0.12) continue; // dark or gray
        const d = max - min;
        let h = 0;
        if (max === r) h = 60 * (((gch - b) / d) % 6);
        else if (max === gch) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - gch) / d + 4);
        if (h < 0) h += 360;
        total += 1;
        if (h < 25 || h >= 330) counts.Red += 1;
        else if (h < 70) counts.Yellow += 1;
        else if (h < 170) counts.Green += 1;
        else if (h < 270) counts.Blue += 1;
      }
      const [best] = (Object.entries(counts) as [CustomRelic["color"], number][]).sort((a, b2) => b2[1] - a[1]);
      return total >= 40 && best[1] / total >= 0.45 ? best[0] : null;
    });
  } catch {
    return groups.map(() => null);
  }
}

function SlotIconImg({ color, size = 20 }: { color: SlotColor; size?: number }) {
  return (
    <Image src={asset(SLOT_ICON[color])} alt={color} title={color} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
  );
}

/** A relic's picture (unique-relic art or a scene image for custom relics). */
function RelicImg({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return (
    <Image src={asset(src)} alt={alt} title={alt} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
  );
}

/**
 * Editable effect lines for a pool relic — each effect input gets a demerit
 * input beneath it (demerits are tied to their line on Deep relics). The
 * demerit input appears once its effect line has text. Pass
 * showDemerits={false} where the relic can't carry demerits (normal slots —
 * only Deep of Night relics have them).
 */
function RelicLineInputs({
  relic,
  onUpdate,
  className,
  showDemerits = true,
}: {
  relic: CustomRelic;
  onUpdate: (r: CustomRelic) => void;
  className?: string;
  showDemerits?: boolean;
}) {
  const setEffect = (i: number, v: string) =>
    onUpdate({
      ...relic,
      effects: [0, 1, 2].map((j) => (j === i ? v : relic.effects[j] ?? "")),
      demerits: [0, 1, 2].map((j) => relic.demerits?.[j] ?? ""),
    });
  const setDemerit = (i: number, v: string) =>
    onUpdate({
      ...relic,
      effects: [0, 1, 2].map((j) => relic.effects[j] ?? ""),
      demerits: [0, 1, 2].map((j) => (j === i ? v : relic.demerits?.[j] ?? "")),
    });
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-1">
          <input
            type="text"
            value={relic.effects[i] ?? ""}
            list={effectListId(!!relic.deep)}
            onChange={(e) => setEffect(i, e.target.value)}
            placeholder={`Effect ${i + 1}${i === 0 ? "" : " (optional)"}`}
            className="frame w-full rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
          />
          {showDemerits && (relic.effects[i] ?? "").trim() !== "" && (
            <input
              type="text"
              value={relic.demerits?.[i] ?? ""}
              list="effect-vocab-curse"
              onChange={(e) => setDemerit(i, e.target.value)}
              placeholder="Demerit (optional)"
              className="ml-3 w-[calc(100%-0.75rem)] rounded border border-red-900/60 bg-night-800 px-2 py-0.5 font-body text-xs text-red-200/90 placeholder:text-red-300/40"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────

/**
 * One saved build. With onDelete it's an interactive card (Share, Delete,
 * plus Edit when onEdit is given — shared builds are view-only, so the
 * Shared Builds tab omits it); with neither it's a read-only preview
 * (shared-link banner).
 */
function BuildCard({
  build,
  store,
  onEdit,
  onDelete,
}: {
  build: Build;
  store: BuildStore;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [copied, setCopied] = useState(false);
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
    try {
      await navigator.clipboard.writeText(url);
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

  return (
    <article className="frame rounded-md bg-night-800 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display font-semibold text-parchment">{build.name || "Unnamed build"}</h4>
          <p className="font-body text-xs text-parchment-faint">
            {build.character} · {build.chalice}
          </p>
          {(build.tags?.length ?? 0) > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {build.tags!.map((t) => (
                <span key={t} className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-[10px] text-parchment-faint">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {onDelete && (
          <div className="flex gap-1.5">
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
      {/* Mobile-only view toggle — the stacked sections mean a lot of
          scrolling on small screens, so show one set at a time there. */}
      {hasDeep && (
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
      <div className={`mt-4 space-y-4 ${view === "deep" ? "hidden sm:block" : ""}`}>
        {renderSlots(build.slots, chalice?.slots)}
      </div>
      {hasDeep && (
        <div className={`mt-4 border-t border-night-700 pt-3 ${view === "normal" ? "hidden sm:block" : ""}`}>
          <p className="eyebrow mb-2 text-gold-dim">Deep of Night</p>
          <div className="space-y-4">{renderSlots(build.deepSlots, chalice?.deep)}</div>
        </div>
      )}
    </article>
  );
}

/**
 * Tag registry editor: create, rename (type in place, Enter/blur commits),
 * and delete. Renames and deletes ripple through every build's tags.
 */
function TagManager({
  tags,
  usage,
  onCreate,
  onRename,
  onDelete,
}: {
  tags: string[];
  usage: (tag: string) => number;
  onCreate: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const create = () => {
    if (newTag.trim()) {
      onCreate(newTag);
      setNewTag("");
    }
  };
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4">
      <h3 className="font-display text-sm font-semibold text-parchment">Tags</h3>
      <p className="mt-0.5 font-body text-xs text-parchment-faint">
        Tag builds from the build editor, then filter the list by tag here. Renaming or
        deleting a tag updates every build that uses it.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              create();
            }
          }}
          placeholder="New tag"
          className="frame w-40 rounded bg-night-900 px-2 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={create}
          disabled={!newTag.trim()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      {tags.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {tags.map((t) => (
            <TagRow key={t} tag={t} count={usage(t)} onRename={onRename} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TagRow({
  tag,
  count,
  onRename,
  onDelete,
}: {
  tag: string;
  count: number;
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
}) {
  const [draft, setDraft] = useState(tag);
  const commit = () => {
    if (draft.trim() && draft.trim() !== tag) onRename(tag, draft);
    else setDraft(tag);
  };
  return (
    <li className="flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(tag);
        }}
        aria-label={`Rename tag ${tag}`}
        className="frame w-40 rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment"
      />
      <span className="font-body text-xs text-parchment-faint">
        {count === 1 ? "1 build" : `${count} builds`}
      </span>
      <button
        type="button"
        onClick={() => onDelete(tag)}
        className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
      >
        Delete
      </button>
    </li>
  );
}

const COLOR_ORDER: Record<CustomRelic["color"], number> = { Red: 0, Blue: 1, Green: 2, Yellow: 3 };

function MyRelics({
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

// ── Editor view ──────────────────────────────────────────────────────────

function BuildEditor({
  initial,
  store,
  onSave,
  onCancel,
  onAddCustomRelic,
  onUpdateCustomRelic,
  onCreateTag,
}: {
  initial: Build;
  store: BuildStore;
  onSave: (b: Build) => void;
  onCancel: () => void;
  onAddCustomRelic: (r: CustomRelic) => void;
  onUpdateCustomRelic: (r: CustomRelic) => void;
  onCreateTag: (name: string) => void;
}) {
  const [build, setBuild] = useState<Build>(initial);
  const [newRelicAt, setNewRelicAt] = useState<SlotRef | null>(null);
  const [newTag, setNewTag] = useState("");
  const chalices = chalicesFor(build.character);
  const chalice = chalices.find((c) => c.name === build.chalice) ?? chalices[0];

  // Create the tag in the registry and put it on this build in one step.
  const addNewTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    onCreateTag(tag);
    setBuild((b) => ({ ...b, tags: sortedTags([...(b.tags ?? []), tag]) }));
    setNewTag("");
  };

  const setSlot = (at: SlotRef, slot: BuildSlot) => {
    setBuild((b) => {
      const key = at.deep ? "deepSlots" : "slots";
      const slots = [...b[key]] as SlotTriple;
      slots[at.index] = slot;
      return { ...b, [key]: slots };
    });
    // Filling a slot supersedes its pending new-relic form.
    setNewRelicAt((cur) => (cur && cur.deep === at.deep && cur.index === at.index ? null : cur));
  };

  // Reuse an identical pool relic instead of adding a duplicate — the same
  // relic imported twice (or owned twice) is one pool entry slotted twice.
  // The ref also covers relics added earlier in the same batch (Apply all),
  // before the parent's state update lands.
  const pendingRelics = useRef<CustomRelic[]>([]);
  const addOrReuseRelic = (relic: CustomRelic): string => {
    const existing =
      store.customRelics.find((r) => sameCustomRelic(r, relic)) ??
      pendingRelics.current.find((r) => sameCustomRelic(r, relic));
    if (existing) return existing.id;
    pendingRelics.current.push(relic);
    onAddCustomRelic(relic);
    return relic.id;
  };

  const applyGroup = (
    group: {
      name: string | null;
      effects: string[];
      demerits: string[];
      color?: CustomRelic["color"] | null;
    },
    at: SlotRef,
  ) => {
    const slotColor = (at.deep ? chalice.deep : chalice.slots)[at.index];
    // Deep slots never take fixed relics — every Depth relic is a custom
    // roll, even when it shares a name with a fixed one.
    const fixed = !at.deep && group.name ? fixedRelics.find((r) => r.name === group.name) : null;
    if (fixed) {
      setSlot(at, { kind: "fixed", name: fixed.name });
      return;
    }
    const color =
      group.color ??
      colorFromRelicName(group.name) ??
      (slotColor === "White" ? "Red" : (slotColor as CustomRelic["color"]));
    const id = addOrReuseRelic({
      id: newId(),
      name: group.name ?? "",
      color,
      effects: group.effects.slice(0, 3),
      demerits: group.demerits.slice(0, 3),
      deep: at.deep,
    });
    setSlot(at, { kind: "custom", id });
  };

  const slotSection = (deep: boolean) => {
    const colors = deep ? chalice.deep : chalice.slots;
    return colors.map((slotColor, index) => {
      const at: SlotRef = { deep, index };
      const isNewHere = newRelicAt?.deep === deep && newRelicAt.index === index;
      const value = deep ? build.deepSlots[index] : build.slots[index];
      const resolved = resolveSlot(value, store);
      const customRelic =
        value?.kind === "custom" ? store.customRelics.find((r) => r.id === value.id) : undefined;
      return (
        <div key={index} className="frame rounded-md bg-night-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SlotIconImg color={slotColor} size={26} />
            <RelicPicker
              character={build.character}
              slotColor={slotColor}
              deep={deep}
              store={store}
              value={value}
              onChange={(slot) => setSlot(at, slot)}
              onNewRelic={() => setNewRelicAt(isNewHere ? null : at)}
            />
          </div>
          {customRelic ? (
            // Custom relics stay editable line by line, right in the slot.
            <RelicLineInputs
              relic={customRelic}
              onUpdate={onUpdateCustomRelic}
              className="mt-2"
              showDemerits={deep}
            />
          ) : (
            resolved && <EffectLines lines={resolved.lines} className="mt-1.5 space-y-0.5" />
          )}
          {isNewHere && (
            <CustomRelicEditor
              slotColor={slotColor}
              deep={deep}
              onSave={(relic) => {
                setSlot(at, { kind: "custom", id: addOrReuseRelic(relic) });
                setNewRelicAt(null);
              }}
              onCancel={() => setNewRelicAt(null)}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div>
      <button type="button" onClick={onCancel} className="mb-4 font-body text-sm text-parchment-muted hover:text-gold-bright">
        ← All builds
      </button>

      {/* Character first, then chalice and slots follow from it. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {characterChalices.map((c) => {
          const active = c.name === build.character;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() =>
                setBuild((b) =>
                  b.character === c.name
                    ? b
                    : { ...b, character: c.name, chalice: chalicesFor(c.name)[0].name },
                )
              }
              aria-pressed={active}
              className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
                active
                  ? "bg-night-700 text-gold-bright"
                  : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
              }`}
              style={active ? { borderColor: "#c9a227" } : undefined}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={build.name}
          onChange={(e) => setBuild((b) => ({ ...b, name: e.target.value }))}
          placeholder="Build name"
          className="frame w-64 rounded bg-night-900 px-3 py-2 font-display text-lg text-parchment placeholder:text-parchment-faint"
        />
        {/* Swapping chalices keeps slotted relics — colors are the user's call. */}
        <ChalicePicker
          chalices={chalices}
          value={chalice}
          onChange={(name) => setBuild((b) => ({ ...b, chalice: name }))}
        />
        <ScreenshotBuildImport
          chalice={chalice}
          chalices={chalices}
          onApply={applyGroup}
          onSwapChalice={(name) => setBuild((b) => ({ ...b, chalice: name }))}
        />
      </div>

      {/* Tags — pick from your registry, or create one right here. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {store.tags.length > 0 && (
          <MultiSelect
            values={build.tags ?? []}
            options={store.tags.map((t) => ({ value: t, label: t }))}
            onChange={(tags) => setBuild((b) => ({ ...b, tags }))}
            placeholder="Tags"
            className="w-44"
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
          className="frame w-36 rounded bg-night-900 px-2 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={addNewTag}
          disabled={!newTag.trim()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          + Add tag
        </button>
        {(build.tags ?? []).map((t) => (
          <span key={t} className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="eyebrow mb-2">Relic Slots</h3>
          <div className="space-y-3">{slotSection(false)}</div>
        </section>
        <section>
          <h3 className="eyebrow mb-2 text-gold-dim">Deep of Night Slots</h3>
          <div className="space-y-3">{slotSection(true)}</div>
        </section>
      </div>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => onSave(build)} className="frame rounded-md bg-night-700 px-5 py-2 font-body text-sm text-gold-bright hover:bg-night-600">
          Save build
        </button>
        <button type="button" onClick={onCancel} className="frame rounded-md bg-night-800 px-5 py-2 font-body text-sm text-parchment-muted hover:text-parchment">
          Cancel
        </button>
      </div>

      <EffectDatalists />
    </div>
  );
}

// ── Pickers ──────────────────────────────────────────────────────────────

function ChalicePicker({ chalices, value, onChange }: { chalices: Chalice[]; value: Chalice; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="frame flex items-center gap-2 rounded-md bg-night-900 px-3 py-2 font-body text-sm text-parchment hover:bg-night-800"
      >
        <span>{value.name}</span>
        <span className="flex items-center gap-0.5">
          {value.slots.map((s, i) => (
            <SlotIconImg key={i} color={s} size={16} />
          ))}
        </span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-parchment-faint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 max-h-80 w-[26rem] max-w-[90vw] overflow-y-auto rounded-md border border-night-500 bg-night-850 p-1 shadow-lift">
            {chalices.map((c) => {
              const active = c.name === value.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left font-body text-sm ${
                    active ? "bg-night-700 text-gold-bright" : "text-parchment-muted hover:bg-night-800 hover:text-parchment"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {c.slots.map((s, i) => (
                      <SlotIconImg key={`n${i}`} color={s} size={16} />
                    ))}
                    <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
                    {c.deep.map((s, i) => (
                      <span key={`d${i}`} className="opacity-60">
                        <SlotIconImg color={s} size={16} />
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
            <p className="px-2 py-1 font-body text-[0.65rem] text-parchment-faint">
              Bright icons: normal slots · dimmed: Deep of Night
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function RelicPicker({
  character,
  slotColor,
  deep,
  store,
  value,
  onChange,
  onNewRelic,
}: {
  character: string;
  slotColor: SlotColor;
  deep: boolean;
  store: BuildStore;
  value: BuildSlot;
  onChange: (slot: BuildSlot) => void;
  onNewRelic: () => void;
}) {
  const [open, setOpen] = useState(false);
  const resolved = resolveSlot(value, store);

  return (
    <div className="min-w-0 flex-1">
      {resolved ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-body text-sm text-parchment">{resolved.name}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
          >
            Swap
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ) : (
        // An empty slot offers its two paths outright: create a relic, or
        // pick one from the pool/game list.
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNewRelic}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            + Add new relic
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            Load relic…
          </button>
        </div>
      )}
      {open && (
        <RelicBrowser
          character={character}
          slotColor={slotColor}
          deep={deep}
          store={store}
          value={value}
          onPick={(slot) => {
            onChange(slot);
            setOpen(false);
          }}
          onNewRelic={() => {
            setOpen(false);
            onNewRelic();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Full-screen modal relic browser: relics that fit the slot shown as cards
 * with every effect line visible, so similar relics can be told apart at a
 * glance. Search covers names, effects, and character.
 */
/** The fixed-relic groupings shown as tables in the browser. */
const FIXED_SECTIONS: { key: "nightlord" | "other"; title: string; groups: FixedRelicOption["group"][] }[] = [
  { key: "nightlord", title: "Nightlord Relics", groups: ["nightlord", "everdark"] },
  { key: "other", title: "Remembrance & Other", groups: ["swap", "character", "shop", "boss"] },
];

const BROWSER_TABS = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Relics" },
  { key: "nightlord", label: "Nightlord" },
  { key: "other", label: "Remembrance & Other" },
] as const;
type BrowserTab = (typeof BROWSER_TABS)[number]["key"];

/**
 * Order within "Remembrance & Other": the current character's stat swaps,
 * then their Remembrance relics, then all-Nightfarer relics, then other
 * characters' — so a Nightfarer's own gear floats to the top.
 */
function rankOtherSection(r: FixedRelicOption, character: string): number {
  if (r.character === character) return r.group === "swap" ? 0 : 1;
  return !r.character ? 2 : 3;
}

function RelicBrowser({
  character,
  slotColor,
  deep,
  store,
  value,
  onPick,
  onNewRelic,
  onClose,
}: {
  character: string;
  slotColor: SlotColor;
  deep: boolean;
  store: BuildStore;
  value: BuildSlot;
  onPick: (slot: BuildSlot) => void;
  onNewRelic: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<BrowserTab>("all");

  // The page behind the modal shouldn't scroll while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fixed = fixedRelicsFor(character, slotColor, deep);
  // Only relics of the slot's kind fit: deep slots take Deep relics, normal
  // slots take normal ones — same as in-game.
  const custom = store.customRelics.filter(
    (r) => !!r.deep === deep && (slotColor === "White" || r.color === slotColor),
  );
  const query = q.trim().toLowerCase();
  const matches = (name: string, effects: string[], char?: string) =>
    !query ||
    name.toLowerCase().includes(query) ||
    (char ?? "").toLowerCase().includes(query) ||
    effects.some((e) => e.toLowerCase().includes(query));
  const filteredCustom = custom.filter((r) => matches(r.name || `${r.color} relic`, r.effects));
  const filteredFixed = fixed.filter((r) => matches(r.name, r.effects, r.character));

  const showCustom = tab === "all" || tab === "mine";
  const visibleSections = FIXED_SECTIONS.filter((s) => tab === "all" || tab === s.key)
    .map((s) => {
      const rows = filteredFixed.filter((r) => s.groups.includes(r.group));
      if (s.key === "other") {
        rows.sort(
          (a, b) =>
            rankOtherSection(a, character) - rankOtherSection(b, character) ||
            a.name.localeCompare(b.name),
        );
      }
      return { ...s, rows };
    })
    .filter((s) => s.rows.length > 0);

  const customShown = showCustom ? filteredCustom : [];
  const pickFirst = () => {
    const firstFixed = visibleSections[0]?.rows[0];
    if (customShown[0]) onPick({ kind: "custom", id: customShown[0].id });
    else if (firstFixed) onPick({ kind: "fixed", name: firstFixed.name });
  };

  const cardGrid = "grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a relic"
        className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-night-500 bg-night-850 shadow-lift"
      >
        <div className="flex items-center gap-2 border-b border-night-600 px-4 py-3">
          <SlotIconImg color={slotColor} size={22} />
          <h3 className="font-display text-lg font-semibold text-parchment">
            Choose a relic
            <span className="ml-2 font-body text-xs font-normal text-parchment-faint">
              {slotColor === "White" ? "any color fits" : `${slotColor} slot`}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-night-600 px-4 py-2.5">
          <input
            type="text"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pickFirst();
            }}
            placeholder="Search relics or effects…"
            className="frame min-w-48 flex-1 rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onPick(null)}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Empty the slot
          </button>
          <button
            type="button"
            onClick={onNewRelic}
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            + New custom relic…
          </button>
        </div>

        {/* Section tabs — deep slots only ever hold custom relics, so the
            fixed-relic tabs would all be empty there. */}
        <div className={`flex flex-wrap gap-1.5 border-b border-night-600 px-4 py-2 ${deep ? "hidden" : ""}`}>
          {BROWSER_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={active}
                className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                  active
                    ? "bg-night-700 text-gold-bright"
                    : "bg-night-900 text-parchment-muted hover:bg-night-800 hover:text-parchment"
                }`}
                style={active ? { borderColor: "#c9a227" } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto p-4">
          {customShown.length > 0 && (
            <>
              <p className="eyebrow mb-2">My relics</p>
              <div className={cardGrid}>
                {customShown.map((r) => (
                  <RelicBrowserCard
                    key={r.id}
                    name={r.name || `${r.color} relic`}
                    icon={customRelicIcon(r)}
                    lines={r.effects
                      .map((text, i) => ({ text, demerit: r.demerits?.[i]?.trim() || undefined }))
                      .filter((l) => l.text.trim())}
                    active={value?.kind === "custom" && value.id === r.id}
                    onClick={() => onPick({ kind: "custom", id: r.id })}
                  />
                ))}
              </div>
            </>
          )}
          {visibleSections.map(({ title, rows }) => (
            <div key={title} className="mt-4 first:mt-0">
              <p className="eyebrow mb-1.5">{title}</p>
              <FixedRelicTable relics={rows} character={character} value={value} onPick={onPick} />
            </div>
          ))}
          {customShown.length === 0 && visibleSections.length === 0 && (
            <p className="py-6 text-center font-body text-sm text-parchment-faint">
              {query ? (
                <>Nothing matches “{q}”.</>
              ) : deep ? (
                "Deep of Night relics are all custom rolls — add yours with “+ New custom relic”."
              ) : (
                "Nothing here for this slot."
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fixed relics as table rows — name column plus effects, one relic per row. */
function FixedRelicTable({
  relics,
  character,
  value,
  onPick,
}: {
  relics: FixedRelicOption[];
  character: string;
  value: BuildSlot;
  onPick: (slot: BuildSlot) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {relics.map((r) => {
          const active = value?.kind === "fixed" && value.name === r.name;
          return (
            <tr
              key={r.name}
              tabIndex={0}
              onClick={() => onPick({ kind: "fixed", name: r.name })}
              onKeyDown={(e) => {
                if (e.key === "Enter") onPick({ kind: "fixed", name: r.name });
              }}
              className={`cursor-pointer border-b border-night-700 transition-colors last:border-b-0 ${
                active ? "bg-night-700" : "hover:bg-night-800"
              }`}
            >
              <td className="w-[40%] min-w-44 py-2 pl-1 pr-3 align-top">
                <span className="flex items-center gap-2">
                  <RelicImg src={r.icon} alt="" size={24} />
                  <span className={`font-body text-sm ${active ? "text-gold-bright" : "text-parchment"}`}>
                    {r.name}
                  </span>
                  {r.character && r.character !== character && (
                    <span className="shrink-0 rounded border border-night-600 px-1 font-body text-[0.6rem] text-parchment-faint">
                      {r.character}
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2 pr-1 align-top">
                <EffectLines lines={r.effects.map((text) => ({ text }))} className="space-y-0.5" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RelicBrowserCard({
  name,
  icon,
  tag,
  lines,
  active,
  onClick,
}: {
  name: string;
  icon: string;
  tag?: string;
  lines: ResolvedLine[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`frame w-full rounded-md p-3 text-left transition-colors ${
        active ? "bg-night-700" : "bg-night-800 hover:bg-night-700"
      }`}
      style={active ? { borderColor: "#c9a227" } : undefined}
    >
      <span className="flex items-center gap-2">
        <RelicImg src={icon} alt="" size={24} />
        <span className={`font-body text-sm ${active ? "text-gold-bright" : "text-parchment"}`}>{name}</span>
        {tag && (
          <span className="rounded border border-night-600 px-1 font-body text-[0.6rem] text-parchment-faint">{tag}</span>
        )}
      </span>
      <EffectLines lines={lines} divided className="mt-2" />
    </button>
  );
}

// ── Custom relic editor (modal, with searchable effects + screenshot parse) ──

function CustomRelicEditor({
  slotColor,
  deep,
  allowKindChoice = false,
  onSave,
  onCancel,
}: {
  slotColor: SlotColor;
  /** Whether this relic is for a Deep of Night slot — only those have demerits. */
  deep: boolean;
  /**
   * Show a Normal/Deep choice (pool creation from My Relics, where no slot
   * dictates the kind); `deep` is then just the starting value.
   */
  allowKindChoice?: boolean;
  onSave: (r: CustomRelic) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CustomRelic>({
    id: "",
    name: "",
    color: slotColor === "White" ? "Red" : (slotColor as CustomRelic["color"]),
    effects: ["", "", ""],
    demerits: ["", "", ""],
    deep,
  });
  const [q, setQ] = useState("");
  const isDeep = !!draft.deep;
  // A colored slot dictates the relic's color — only White slots ask.
  const askColor = slotColor === "White";

  // The page behind the modal shouldn't scroll while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const addEffect = (effect: string) =>
    setDraft((d) => {
      if (isCurseEffect(effect)) {
        // Demerits attach to an effect line — use the last filled one.
        // Normal relics can't carry demerits, so a curse line is a misparse.
        if (!d.deep) return d;
        const i = d.effects.map((e) => e.trim() !== "").lastIndexOf(true);
        if (i === -1 || d.demerits[i]) return d;
        return { ...d, demerits: d.demerits.map((x, j) => (j === i ? effect : x)) };
      }
      if (d.effects.includes(effect)) return d;
      const i = d.effects.findIndex((x) => !x.trim());
      return i === -1 ? d : { ...d, effects: d.effects.map((x, j) => (j === i ? effect : x)) };
    });

  const query = q.trim().toLowerCase();
  // Only effects that can legally roll on this relic kind — the Deep pool
  // also lists curses, which addEffect routes to a demerit line.
  const vocab = (isDeep ? DEEP_CREATE_VOCABULARY : NORMAL_EFFECT_VOCABULARY).filter(
    (e) => !query || e.toLowerCase().includes(query),
  );
  const chosen = new Set([...draft.effects, ...draft.demerits].filter((e) => e.trim()));

  const save = () => {
    const kept = [0, 1, 2].filter((i) => (draft.effects[i] ?? "").trim());
    if (kept.length === 0) {
      window.alert("Add at least one effect.");
      return;
    }
    onSave({
      id: newId(),
      name: draft.name.trim(),
      color: draft.color,
      effects: kept.map((i) => draft.effects[i].trim()),
      demerits: kept.map((i) => (isDeep ? (draft.demerits[i] ?? "").trim() : "")),
      deep: isDeep,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New custom relic"
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-night-500 bg-night-850 shadow-lift"
      >
        <div className="flex items-center gap-2 border-b border-night-600 px-4 py-3">
          <SlotIconImg color={askColor ? draft.color : slotColor} size={22} />
          <h3 className="font-display text-lg font-semibold text-parchment">
            New custom relic
            <span className="ml-2 font-body text-xs font-normal text-parchment-faint">
              {allowKindChoice ? "added to your pool" : askColor ? "any color fits this slot" : `${slotColor} slot`}
              {isDeep && " · Deep of Night"}
            </span>
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="ml-auto rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Relic name (optional)"
              className="frame w-64 rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
            />
            {askColor && (
              <select
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value as CustomRelic["color"] }))}
                className="frame rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment"
              >
                {RELIC_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {allowKindChoice && (
              <div className="flex overflow-hidden rounded-md border border-night-600" role="group" aria-label="Relic kind">
                {([false, true] as const).map((kind) => (
                  <button
                    key={String(kind)}
                    type="button"
                    onClick={() =>
                      setDraft((d) =>
                        kind
                          ? { ...d, deep: true }
                          : { ...d, deep: false, demerits: ["", "", ""] },
                      )
                    }
                    aria-pressed={isDeep === kind}
                    className={`px-2.5 py-1.5 font-body text-xs transition-colors ${
                      isDeep === kind
                        ? "bg-night-700 text-gold-bright"
                        : "bg-night-900 text-parchment-muted hover:text-parchment"
                    }`}
                  >
                    {kind ? "Deep of Night" : "Normal"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <RelicLineInputs relic={draft} onUpdate={setDraft} className="mt-3" showDemerits={isDeep} />

          <p className="eyebrow mb-1.5 mt-4">Add effects</p>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search effects…"
            className="frame w-full rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
          />
          <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-night-700">
            {vocab.map((e) => {
              const isDemerit = isDeep && isCurseEffect(e);
              const picked = chosen.has(e);
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEffect(e)}
                  className={`flex w-full items-baseline gap-2 px-2.5 py-1.5 text-left font-body text-xs hover:bg-night-800 ${
                    picked ? "text-gold-dim" : "text-parchment-muted hover:text-parchment"
                  }`}
                >
                  <span className="min-w-0 flex-1">{e}</span>
                  {isDemerit && (
                    <span className="shrink-0 rounded border border-red-900/60 px-1 text-[0.6rem] text-red-300/80">
                      demerit
                    </span>
                  )}
                  {picked && <span className="shrink-0">✓</span>}
                </button>
              );
            })}
            {vocab.length === 0 && (
              <p className="px-2.5 py-2 font-body text-xs text-parchment-faint">Nothing matches “{q}”.</p>
            )}
          </div>

          <SingleRelicParse onPick={addEffect} />
        </div>

        <div className="flex gap-2 border-t border-night-600 px-4 py-3">
          <button type="button" onClick={save} className="frame rounded-md bg-night-700 px-4 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600">
            Save relic
          </button>
          <button type="button" onClick={onCancel} className="frame rounded-md bg-night-800 px-4 py-1.5 font-body text-sm text-parchment-muted hover:text-parchment">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SingleRelicParse({ onPick }: { onPick: (effect: string) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<EffectMatch[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = async (file: File) => {
    setBusy(true);
    setMatches(null);
    try {
      const lines = await ocrLines(file, setStatus);
      const found = matchOcrLines(lines.map((l) => l.text));
      setMatches(found);
      setStatus(
        found.length > 0
          ? "Click an effect to add it — then fix anything the parser got wrong."
          : "No relic effects recognized. Try a sharper, closer screenshot of the effect text.",
      );
    } catch {
      setStatus("Couldn't run the parser — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-night-700 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="frame rounded-md bg-night-800 px-3 py-1 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-50"
        >
          Parse screenshot
        </button>
        <span className="font-body text-xs text-parchment-faint">
          {status ?? "Prefill effects from a photo of this relic's effect text."}
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parse(f);
          e.target.value = "";
        }}
      />
      {matches && matches.length > 0 && (
        <ul className="mt-2 space-y-1">
          {matches.slice(0, 10).map((m) => (
            <li key={m.effect}>
              <button
                type="button"
                onClick={() => onPick(m.effect)}
                className="w-full rounded border border-night-700 px-2 py-1 text-left font-body text-xs text-parchment-muted hover:border-night-500 hover:text-parchment"
              >
                {m.effect}
                <span className={`ml-2 ${m.score >= 0.8 ? "text-emerald-300/80" : "text-yellow-300/70"}`}>
                  {Math.round(m.score * 100)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Whole-screenshot import ──────────────────────────────────────────────

const SLOT_TARGETS: { label: string; at: SlotRef }[] = [
  { label: "Slot 1", at: { deep: false, index: 0 } },
  { label: "Slot 2", at: { deep: false, index: 1 } },
  { label: "Slot 3", at: { deep: false, index: 2 } },
  { label: "Deep 1", at: { deep: true, index: 0 } },
  { label: "Deep 2", at: { deep: true, index: 1 } },
  { label: "Deep 3", at: { deep: true, index: 2 } },
];

/** A parsed relic being reviewed — every line stays editable until applied. */
interface EditableGroup {
  name: string | null;
  deep: boolean;
  /** Up to three effect lines. */
  lines: string[];
  /** Per-line demerits — demerits[i] belongs to lines[i]. */
  demerits: string[];
  /** Color read from the relic icon in the screenshot, when it could be. */
  color: CustomRelic["color"] | null;
}

/**
 * Whole-screenshot import for the My Relics tab: same parser as the build
 * editor's, but parsed relics land in the pool instead of slots. Colors come
 * from icon sampling with a per-relic override; exact duplicates of pool
 * relics are flagged instead of added twice.
 */
function ScreenshotPoolImport({
  relics,
  onAdd,
}: {
  relics: CustomRelic[];
  onAdd: (r: CustomRelic) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [groups, setGroups] = useState<EditableGroup[] | null>(null);
  const [colors, setColors] = useState<CustomRelic["color"][]>([]);
  const [added, setAdded] = useState<("new" | "dupe" | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Covers relics added earlier in the same batch (Add all), before the
  // parent's state update lands.
  const batch = useRef<CustomRelic[]>([]);

  const parse = async (file: File) => {
    setBusy(true);
    setGroups(null);
    batch.current = [];
    try {
      const ocr = await ocrLines(file, setStatus);
      const texts = ocr.map((l) => l.text);
      const found = parseRelicGroups(texts);
      // A screenshot shows either normal relics or Deep relics — never both.
      const allDeep = found.some((g) => g.deep);
      const guessed = await guessGroupColors(
        file,
        found.map((g) => {
          const first = g.effects[0]?.line ?? null;
          const box = first ? ocr.find((l) => l.text.trim() === first.trim())?.bbox ?? null : null;
          return { firstLine: first, bbox: box };
        }),
      );
      setGroups(
        found.map((g, i) => ({
          name: g.name,
          deep: allDeep,
          lines: [0, 1, 2].map((j) => g.effects[j]?.effect ?? ""),
          demerits: [0, 1, 2].map((j) => g.demerits[j] ?? ""),
          color: guessed[i],
        })),
      );
      setColors(found.map((_, i) => guessed[i] ?? "Red"));
      setAdded(found.map(() => null));
      setStatus(
        found.length > 0
          ? `Found ${found.length} relic${found.length === 1 ? "" : "s"}${
              allDeep ? " — these look like Deep relics" : ""
            }. Check each color, edit any line, and add.`
          : "No relics recognized. Try a sharper screenshot of the relic list.",
      );
    } catch {
      setStatus("Couldn't run the parser — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const setLine = (gi: number, li: number, text: string) =>
    setGroups((gs) =>
      gs
        ? gs.map((g, i) => (i === gi ? { ...g, lines: g.lines.map((l, j) => (j === li ? text : l)) } : g))
        : gs,
    );
  const setDemerit = (gi: number, li: number, text: string) =>
    setGroups((gs) =>
      gs
        ? gs.map((g, i) =>
            i === gi ? { ...g, demerits: g.demerits.map((d, j) => (j === li ? text : d)) } : g,
          )
        : gs,
    );
  // The kind applies screenshot-wide (they're never mixed); going normal
  // drops demerits, which only Deep relics carry.
  const setAllDeep = (deep: boolean) =>
    setGroups((gs) =>
      gs ? gs.map((g) => ({ ...g, deep, demerits: deep ? g.demerits : ["", "", ""] })) : gs,
    );

  const addOne = (i: number) => {
    if (!groups || added[i]) return;
    const g = groups[i];
    const kept = [0, 1, 2].filter((j) => (g.lines[j] ?? "").trim());
    if (kept.length === 0) return;
    const relic: CustomRelic = {
      id: newId(),
      name: g.name ?? "",
      color: colors[i],
      effects: kept.map((j) => g.lines[j].trim()),
      demerits: kept.map((j) => (g.deep ? (g.demerits[j] ?? "").trim() : "")),
      deep: g.deep,
    };
    if (
      relics.some((r) => sameCustomRelic(r, relic)) ||
      batch.current.some((r) => sameCustomRelic(r, relic))
    ) {
      setAdded((a) => a.map((x, j) => (j === i ? "dupe" : x)));
      return;
    }
    batch.current.push(relic);
    onAdd(relic);
    setAdded((a) => a.map((x, j) => (j === i ? "new" : x)));
  };

  const isDeep = groups?.some((g) => g.deep) ?? false;

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        title="Screenshot the relic rites screen (relic names + effects visible); the parser groups what it reads into relics you can add to your pool. Fix anything it misreads first."
        className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-50"
      >
        Import from screenshot
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parse(f);
          e.target.value = "";
        }}
      />
      {status && <span className="max-w-md font-body text-xs text-parchment-faint">{status}</span>}
      {groups && groups.length > 0 && (
        <>
          <div className="flex w-full flex-wrap items-center gap-2">
            {added.some((a) => !a) && (
              <button
                type="button"
                onClick={() => groups.forEach((_, i) => addOne(i))}
                className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
              >
                Add all to pool
              </button>
            )}
            <span className="font-body text-xs text-parchment-faint">These are:</span>
            <div className="flex overflow-hidden rounded-md border border-night-600" role="group" aria-label="Imported relic kind">
              {([false, true] as const).map((kind) => (
                <button
                  key={String(kind)}
                  type="button"
                  onClick={() => setAllDeep(kind)}
                  aria-pressed={isDeep === kind}
                  className={`px-2.5 py-1 font-body text-xs transition-colors ${
                    isDeep === kind
                      ? "bg-night-700 text-gold-bright"
                      : "bg-night-900 text-parchment-muted hover:text-parchment"
                  }`}
                >
                  {kind ? "Deep relics" : "Normal relics"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid w-full gap-2 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((g, i) => (
              <div key={i} className="frame rounded-md bg-night-900 p-3">
                <p className="flex items-center gap-2 font-body text-sm text-parchment">
                  {g.name ?? <span className="text-parchment-faint">Unnamed relic</span>}
                  {g.deep && (
                    <span className="rounded border border-night-500 px-1 font-body text-[0.6rem] uppercase tracking-wide text-gold-dim">
                      Deep
                    </span>
                  )}
                </p>
                <div className="mt-2 space-y-1.5">
                  {g.lines.map((line, li) => (
                    <div key={li} className="space-y-1">
                      <input
                        type="text"
                        value={line}
                        list={effectListId(g.deep)}
                        disabled={!!added[i]}
                        onChange={(e) => setLine(i, li, e.target.value)}
                        placeholder={`Effect ${li + 1}${li === 0 ? "" : " (optional)"}`}
                        className="frame w-full rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint disabled:opacity-60"
                      />
                      {g.deep && line.trim() !== "" && (
                        <input
                          type="text"
                          value={g.demerits[li] ?? ""}
                          list="effect-vocab-curse"
                          disabled={!!added[i]}
                          onChange={(e) => setDemerit(i, li, e.target.value)}
                          placeholder="Demerit (optional)"
                          className="ml-3 w-[calc(100%-0.75rem)] rounded border border-red-900/60 bg-night-800 px-2 py-0.5 font-body text-xs text-red-200/90 placeholder:text-red-300/40 disabled:opacity-60"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <SlotIconImg color={colors[i]} size={18} />
                  <select
                    value={colors[i]}
                    disabled={!!added[i]}
                    onChange={(e) =>
                      setColors((cs) => cs.map((c, j) => (j === i ? (e.target.value as CustomRelic["color"]) : c)))
                    }
                    className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment disabled:opacity-60"
                  >
                    {RELIC_COLORS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!!added[i]}
                    onClick={() => addOne(i)}
                    className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600 disabled:opacity-50"
                  >
                    {added[i] === "new" ? "Added ✓" : added[i] === "dupe" ? "Already in pool" : "Add to pool"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ScreenshotBuildImport({
  chalice,
  chalices,
  onApply,
  onSwapChalice,
}: {
  chalice: Chalice;
  chalices: Chalice[];
  onApply: (
    g: {
      name: string | null;
      effects: string[];
      demerits: string[];
      color?: CustomRelic["color"] | null;
    },
    at: SlotRef,
  ) => void;
  onSwapChalice: (name: string) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [groups, setGroups] = useState<EditableGroup[] | null>(null);
  const [chaliceGuess, setChaliceGuess] = useState<string | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [applied, setApplied] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = async (file: File) => {
    setBusy(true);
    setGroups(null);
    setChaliceGuess(null);
    try {
      const ocr = await ocrLines(file, setStatus);
      const texts = ocr.map((l) => l.text);
      const found = parseRelicGroups(texts);
      const seen = bestLineMatch(texts, chalices.map((c) => c.name));
      setChaliceGuess(seen?.effect ?? null);
      // A screenshot shows either normal relics or Deep relics — never both.
      const allDeep = found.some((g) => g.deep);
      // Color: sample the icon region left of each relic's first line.
      const colors = await guessGroupColors(
        file,
        found.map((g) => {
          const first = g.effects[0]?.line ?? null;
          const box = first ? ocr.find((l) => l.text.trim() === first.trim())?.bbox ?? null : null;
          return { firstLine: first, bbox: box };
        }),
      );
      setGroups(
        found.map((g, i) => ({
          name: g.name,
          deep: allDeep,
          lines: [0, 1, 2].map((j) => g.effects[j]?.effect ?? ""),
          demerits: [0, 1, 2].map((j) => g.demerits[j] ?? ""),
          color: colors[i],
        })),
      );
      setTargets(found.map((_, i) => (allDeep ? Math.min(3 + i, 5) : Math.min(i, 2))));
      setApplied(found.map(() => false));
      setStatus(
        found.length > 0
          ? `Found ${found.length} relic${found.length === 1 ? "" : "s"}${
              allDeep ? " — these look like Deep relics" : ""
            }. Edit any line, pick each one's slot, and apply.`
          : "No relics recognized. Try a sharper screenshot of the relic list.",
      );
    } catch {
      setStatus("Couldn't run the parser — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const setLine = (gi: number, li: number, text: string) =>
    setGroups((gs) =>
      gs
        ? gs.map((g, i) => (i === gi ? { ...g, lines: g.lines.map((l, j) => (j === li ? text : l)) } : g))
        : gs,
    );
  const setDemerit = (gi: number, li: number, text: string) =>
    setGroups((gs) =>
      gs
        ? gs.map((g, i) =>
            i === gi ? { ...g, demerits: g.demerits.map((d, j) => (j === li ? text : d)) } : g,
          )
        : gs,
    );

  const applyOne = (i: number) => {
    if (!groups || applied[i]) return;
    const g = groups[i];
    // Keep effect/demerit pairs together; drop pairs with no effect text.
    const kept = [0, 1, 2].filter((j) => (g.lines[j] ?? "").trim());
    onApply(
      {
        name: g.name,
        effects: kept.map((j) => g.lines[j].trim()),
        demerits: kept.map((j) => (g.demerits[j] ?? "").trim()),
        color: g.color,
      },
      SLOT_TARGETS[targets[i]].at,
    );
    setApplied((a) => a.map((x, j) => (j === i ? true : x)));
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          title="Screenshot the relic rites screen (relic names + effects visible); the parser groups what it reads into relics you can drop into slots. Fix anything it misreads afterwards."
          className="frame rounded-md bg-night-800 px-3 py-2 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-50"
        >
          Import from screenshot
        </button>
        {groups && groups.length > 0 && applied.some((a) => !a) && (
          <button
            type="button"
            onClick={() => groups.forEach((_, i) => applyOne(i))}
            className="frame rounded-md bg-night-700 px-3 py-2 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            Apply all
          </button>
        )}
        {status && <span className="max-w-xs font-body text-xs text-parchment-faint">{status}</span>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parse(f);
          e.target.value = "";
        }}
      />
      {chaliceGuess && chaliceGuess !== chalice.name && (
        <div className="frame flex w-full flex-wrap items-center gap-2 rounded-md bg-night-900 px-3 py-2">
          <span className="font-body text-sm text-parchment-muted">
            The screenshot looks like it uses <span className="text-parchment">{chaliceGuess}</span>.
          </span>
          <button
            type="button"
            onClick={() => {
              onSwapChalice(chaliceGuess);
              setChaliceGuess(null);
            }}
            className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600"
          >
            Switch chalice
          </button>
          <span className="font-body text-xs text-parchment-faint">Slotted relics are kept — shuffle them if the colors moved.</span>
        </div>
      )}
      {groups && groups.length > 0 && (
        <div className="grid w-full gap-2 lg:grid-cols-2">
          {groups.map((g, i) => (
            <div key={i} className="frame rounded-md bg-night-900 p-3">
              <p className="flex items-center gap-2 font-body text-sm text-parchment">
                {g.color && <SlotIconImg color={g.color} size={18} />}
                {g.name ?? <span className="text-parchment-faint">Unnamed relic</span>}
                {g.deep && (
                  <span className="rounded border border-night-500 px-1 font-body text-[0.6rem] uppercase tracking-wide text-gold-dim">
                    Deep
                  </span>
                )}
              </p>
              <div className="mt-2 space-y-1.5">
                {g.lines.map((line, li) => (
                  <div key={li} className="space-y-1">
                    <input
                      type="text"
                      value={line}
                      list={effectListId(g.deep)}
                      disabled={applied[i]}
                      onChange={(e) => setLine(i, li, e.target.value)}
                      placeholder={`Effect ${li + 1}${li === 0 ? "" : " (optional)"}`}
                      className="frame w-full rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint disabled:opacity-60"
                    />
                    {g.deep && line.trim() !== "" && (
                      <input
                        type="text"
                        value={g.demerits[li] ?? ""}
                        list="effect-vocab-curse"
                        disabled={applied[i]}
                        onChange={(e) => setDemerit(i, li, e.target.value)}
                        placeholder="Demerit (optional)"
                        className="ml-3 w-[calc(100%-0.75rem)] rounded border border-red-900/60 bg-night-800 px-2 py-0.5 font-body text-xs text-red-200/90 placeholder:text-red-300/40 disabled:opacity-60"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={targets[i]}
                  onChange={(e) => setTargets((t) => t.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                  className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment"
                >
                  {SLOT_TARGETS.map((t, j) => {
                    const color = t.at.deep ? chalice.deep[t.at.index] : chalice.slots[t.at.index];
                    return (
                      <option key={t.label} value={j}>
                        {t.label} ({color})
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  disabled={applied[i]}
                  onClick={() => applyOne(i)}
                  className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600 disabled:opacity-50"
                >
                  {applied[i] ? "Applied ✓" : "Apply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
