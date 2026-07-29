"use client";

// ── Screenshot import into a build's slots ───────────────────────────────
//  OCRs one relic-rites screenshot and offers what it read as relics to drop
//  into the open build's slots. The My Relics pool has its own importer (see
//  ImportRelics) which takes several screenshots at once — a build holds only
//  three relics per set, so there is nothing here for a batch to fill.

import { useRef, useState } from "react";
import type { CustomRelic } from "@/lib/builds";
import type { Chalice } from "@/lib/chalices";
import { bestLineMatch } from "@/lib/effectMatch";
import {
  IconButton,
  SlotIconImg,
  XIcon,
  ReviewLineInputs,
  readScreenshot,
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
    // A new screenshot replaces the last one outright — leftover cards from a
    // previous import (applied or still undecided) are dropped. Relics already
    // applied stay in their slots.
    setGroups(null);
    setChaliceGuess(null);
    setTargets([]);
    setApplied([]);
    try {
      // A build holds exactly three relics per set, so anything past the
      // third group is OCR spillover (a doubled line, the selected relic's
      // detail pane) — never offer a 4th relic for 3 slots.
      const read = await readScreenshot(file, setStatus, { maxGroups: 3 });
      const seen = bestLineMatch(read.lines, chalices.map((c) => c.name));
      setChaliceGuess(seen?.effect ?? null);
      setGroups(
        read.relics.map((r) => ({
          name: r.name,
          deep: read.deep,
          lines: r.effects,
          demerits: r.demerits,
          color: r.color,
        })),
      );
      setTargets(read.relics.map((_, i) => (read.deep ? Math.min(3 + i, 5) : Math.min(i, 2))));
      setApplied(read.relics.map(() => false));
      setStatus(
        read.relics.length > 0
          ? `Found ${read.relics.length} relic${read.relics.length === 1 ? "" : "s"}${
              read.deep ? " — these look like Deep relics" : ""
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

  // Dismiss the parsed cards — relics already applied stay in their slots.
  const clearResults = () => {
    setGroups(null);
    setStatus(null);
    setChaliceGuess(null);
    setTargets([]);
    setApplied([]);
  };

  // Reject a single parsed relic — it leaves the review list entirely.
  const dismissOne = (i: number) => {
    if (!groups) return;
    if (groups.length === 1) {
      clearResults();
      return;
    }
    setGroups(groups.filter((_, j) => j !== i));
    setTargets((t) => t.filter((_, j) => j !== i));
    setApplied((a) => a.filter((_, j) => j !== i));
  };

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
          Import relics from screenshot
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
        {groups && groups.length > 0 && (
          <button
            type="button"
            onClick={clearResults}
            title="Dismiss these results — relics you already applied stay in their slots."
            className="frame rounded-md bg-night-800 px-3 py-2 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Clear
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
          <span className="font-body text-xs text-parchment-faint">
            Slotted relics the new sockets accept are kept; the rest are cleared.
          </span>
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
              <div className="flex items-start gap-2">
                <p className="flex flex-1 items-center gap-2 font-body text-sm text-parchment">
                  {shownColor && <SlotIconImg color={shownColor} size={18} />}
                  {g.name ?? <span className="text-parchment-faint">Unnamed relic</span>}
                  {g.deep && (
                    <span className="rounded border border-night-500 px-1 font-body text-[0.6rem] uppercase tracking-wide text-gold-dim">
                      Deep
                    </span>
                  )}
                </p>
                <IconButton
                  label={applied[i] ? "Dismiss this card" : "Reject this relic"}
                  onClick={() => dismissOne(i)}
                  danger={!applied[i]}
                >
                  <XIcon />
                </IconButton>
              </div>
              <ReviewLineInputs
                lines={g.lines}
                demerits={g.demerits}
                deep={g.deep}
                disabled={applied[i]}
                onLine={(li, v) => setLine(i, li, v)}
                onDemerit={(li, v) => setDemerit(i, li, v)}
              />
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
