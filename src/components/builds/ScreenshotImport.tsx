"use client";

// ── Whole-screenshot import ──────────────────────────────────────────────
//  Both importers OCR a relic-rites screenshot into editable relic groups:
//  ScreenshotPoolImport lands them in the My Relics pool, and
//  ScreenshotBuildImport drops them into a build's slots.

import { useRef, useState } from "react";
import { newId, sameCustomRelic, type CustomRelic } from "@/lib/builds";
import type { Chalice } from "@/lib/chalices";
import { bestLineMatch, parseRelicGroups } from "@/lib/effectMatch";
import {
  RELIC_COLORS,
  SlotIconImg,
  effectListId,
  guessGroupColors,
  ocrLines,
  type SlotRef,
} from "./shared";

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
export function ScreenshotPoolImport({
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

export function ScreenshotBuildImport({
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
      // A build holds exactly three relics per set, so anything past the
      // third group is OCR spillover (a doubled line, the selected relic's
      // detail pane) — never offer a 4th relic for 3 slots.
      const found = parseRelicGroups(texts).slice(0, 3);
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
          {groups.map((g, i) => {
            // Preview the color the relic will actually get on Apply: the
            // chosen slot dictates it (applyGroup's rule) — the sampled
            // screenshot color only decides for White slots, and Deep
            // screenshots' blue cast makes the sample read Blue anyway.
            const at = SLOT_TARGETS[targets[i]].at;
            const targetColor = at.deep ? chalice.deep[at.index] : chalice.slots[at.index];
            const shownColor = targetColor !== "White" ? targetColor : g.color;
            return (
            <div key={i} className="frame rounded-md bg-night-900 p-3">
              <p className="flex items-center gap-2 font-body text-sm text-parchment">
                {shownColor && <SlotIconImg color={shownColor} size={18} />}
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
            );
          })}
        </div>
      )}
    </>
  );
}
