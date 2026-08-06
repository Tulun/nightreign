"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Import view: read up to four relic-rites screenshots in one go and add
//  what they hold to the My Relics pool.
//
//  The screenshots go through one tesseract worker, one after another —
//  spinning a worker up re-instantiates the WASM engine, and running several
//  at once means several full-resolution images decoded at the same time,
//  which is what gets a phone's browser tab killed. Each screenshot's relics
//  appear the moment it finishes, so leaving part-way through only costs the
//  ones still queued.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { newId, sameCustomRelic, type CustomRelic } from "@/lib/builds";
import {
  RELIC_COLORS,
  IconButton,
  ReviewLineInputs,
  SlotIconImg,
  XIcon,
  lineGapError,
  readScreenshot,
  startOcrSession,
  swapLines,
  type OcrSession,
} from "./shared";

/**
 * Screenshots per run. Reading one is seconds on a laptop but tens of seconds
 * on a phone, and every one of them decodes a full-resolution image — four is
 * as far as this goes before the wait and the pile of cards to review stop
 * being worth it.
 */
const MAX_BATCH = 4;

/** A relic parsed off a screenshot, editable until it's added. */
interface ReviewRelic {
  name: string | null;
  /** Three entries — "" where the screenshot had no line. */
  lines: string[];
  /** demerits[i] belongs to lines[i]; only Deep relics carry them. */
  demerits: string[];
  /** Near-tie runner-up readings per line ("" = none); a chip swaps them in. */
  alternates: string[];
  color: CustomRelic["color"];
  /** Set once the card is handled — it collapses to say what happened. */
  outcome: "new" | "dupe" | null;
}

type ShotState = "queued" | "reading" | "done" | "failed" | "stopped";

interface Shot {
  id: string;
  /** The file's own name — how the review list points back at the picture. */
  label: string;
  state: ShotState;
  /** Progress while reading, the reason once failed, a summary once done. */
  note: string;
  /** A screenshot shows either normal relics or Deep relics — never both. */
  deep: boolean;
  relics: ReviewRelic[];
}

/** The relic a card would add, or null while its lines aren't a relic yet. */
function draftFrom(shot: Shot, r: ReviewRelic): Omit<CustomRelic, "id"> | null {
  // No effects at all, or a gap left by moving a line — neither saves, and
  // "Add to pool" is disabled for both, so this is the backstop for Add all.
  if (lineGapError(r.lines)) return null;
  // Keep effect/demerit pairs together; drop pairs with no effect text.
  const kept = [0, 1, 2].filter((j) => (r.lines[j] ?? "").trim());
  return {
    name: r.name ?? "",
    color: r.color,
    effects: kept.map((j) => r.lines[j].trim()),
    demerits: kept.map((j) => (shot.deep ? (r.demerits[j] ?? "").trim() : "")),
    deep: shot.deep,
  };
}

export function ImportRelics({
  relics,
  onAdd,
  onDone,
}: {
  relics: CustomRelic[];
  onAdd: (r: CustomRelic) => void;
  /** Leave for the pool, once there's something there worth looking at. */
  onDone: () => void;
}) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Relics added during this visit. The pool prop lags a render behind onAdd,
  // and "Add all" can meet the same relic twice inside one render.
  const added = useRef<CustomRelic[]>([]);
  // Bumped to abandon a run in flight, so its late results are dropped rather
  // than written over whatever replaced them.
  const run = useRef(0);
  // Guards against a second run starting on top of one still going; state
  // can't do this job, a stale closure would read it wrong.
  const running = useRef(false);
  const session = useRef<OcrSession | null>(null);

  // Navigating away mid-run abandons it and takes the worker down with it —
  // a tesseract worker left running holds its WASM heap for the whole visit.
  useEffect(
    () => () => {
      run.current += 1;
      void session.current?.terminate();
      session.current = null;
    },
    [],
  );

  const patchShot = (mine: number, i: number, fn: (s: Shot) => Shot) => {
    if (run.current !== mine) return;
    setShots((ss) => ss.map((s, j) => (j === i ? fn(s) : s)));
  };

  const start = async (files: File[]) => {
    if (running.current || files.length === 0) return;
    running.current = true;
    const mine = ++run.current;
    added.current = [];
    setBusy(true);
    setStatus(null);
    setShots(
      files.map((f, i) => ({
        id: newId(),
        label: f.name || `Screenshot ${i + 1}`,
        state: "queued",
        note: "",
        deep: false,
        relics: [],
      })),
    );
    let mySession: OcrSession | null = null;
    try {
      mySession = await startOcrSession((s) => {
        if (run.current === mine) setStatus(s);
      });
      session.current = mySession;
      for (let i = 0; i < files.length; i++) {
        if (run.current !== mine) break;
        setStatus(null);
        patchShot(mine, i, (s) => ({ ...s, state: "reading", note: "Starting…" }));
        try {
          const read = await readScreenshot(
            files[i],
            (note) => patchShot(mine, i, (s) => ({ ...s, note })),
            { session: mySession ?? undefined },
          );
          patchShot(mine, i, (s) => ({
            ...s,
            state: "done",
            deep: read.deep,
            note:
              read.relics.length === 0
                ? "Nothing recognized — try a sharper shot of the relic list."
                : `${read.relics.length} relic${read.relics.length === 1 ? "" : "s"}${
                    read.deep ? ", read as Deep" : ""
                  }`,
            relics: read.relics.map((r) => ({
              name: r.name,
              lines: r.effects,
              demerits: r.demerits,
              alternates: r.alternates,
              // The sample fails on shots where the icon is cropped or dim;
              // Red is only a starting point, every card has a color picker.
              color: r.color ?? "Red",
              outcome: null,
            })),
          }));
        } catch {
          // One unreadable file — an odd format, or a decode that ran out of
          // memory — must not take the rest of the batch down with it.
          patchShot(mine, i, (s) => ({
            ...s,
            state: "failed",
            note: "Couldn't read this one. A PNG or JPEG screenshot works best.",
          }));
        }
      }
    } catch {
      if (run.current === mine) {
        setStatus("Couldn't start the parser — check your connection and try again.");
      }
    } finally {
      // Only ever one run in flight (see running), so this is always ours.
      running.current = false;
      setBusy(false);
      if (run.current === mine) setStatus(null);
      await mySession?.terminate();
      if (session.current === mySession) session.current = null;
    }
  };

  // Give up on what's left. Screenshots already read keep their cards — the
  // in-flight one finishes reading before its worker can be taken down, but
  // its result is dropped along with everything still queued.
  const stop = () => {
    run.current += 1;
    setStatus(null);
    setShots((ss) =>
      ss.map((s) =>
        s.state === "queued" || s.state === "reading"
          ? { ...s, state: "stopped", note: "Stopped before this one was read." }
          : s,
      ),
    );
  };

  const setRelic = (si: number, ri: number, fn: (r: ReviewRelic) => ReviewRelic) =>
    setShots((ss) =>
      ss.map((s, i) =>
        i === si ? { ...s, relics: s.relics.map((r, j) => (j === ri ? fn(r) : r)) } : s,
      ),
    );

  // Normal vs Deep applies to a whole screenshot (they're never mixed), but
  // only to that one — a batch can hold shots of both.
  const setShotDeep = (si: number, deep: boolean) =>
    setShots((ss) => ss.map((s, i) => (i === si ? { ...s, deep } : s)));

  const dropRelic = (si: number, ri: number) =>
    setShots((ss) =>
      ss.map((s, i) => (i === si ? { ...s, relics: s.relics.filter((_, j) => j !== ri) } : s)),
    );

  const dropShot = (si: number) => setShots((ss) => ss.filter((_, i) => i !== si));

  const addOne = (si: number, ri: number) => {
    const shot = shots[si];
    const relic = shot?.relics[ri];
    if (!shot || !relic || relic.outcome) return;
    const draft = draftFrom(shot, relic);
    if (!draft) return;
    const dupe =
      relics.some((p) => sameCustomRelic(p, draft)) ||
      added.current.some((p) => sameCustomRelic(p, draft));
    if (!dupe) {
      const saved: CustomRelic = { id: newId(), ...draft };
      added.current.push(saved);
      onAdd(saved);
    }
    setRelic(si, ri, (r) => ({ ...r, outcome: dupe ? "dupe" : "new" }));
  };

  const addAll = () => shots.forEach((s, i) => s.relics.forEach((_, j) => addOne(i, j)));

  /**
   * Why a card would be skipped, worked out fresh each render so that fixing a
   * misread line — or flipping a screenshot to Deep — clears the flag. Four
   * screenshots of a list you scrolled through overlap heavily, and a repeat
   * shown as a repeat is one less card to read through.
   */
  const dupeNotes = useMemo(() => {
    const seen: { draft: Omit<CustomRelic, "id">; where: string }[] = [];
    return shots.map((shot) =>
      shot.relics.map((r) => {
        if (r.outcome) return null;
        const draft = draftFrom(shot, r);
        if (!draft) return null;
        if (relics.some((p) => sameCustomRelic(p, draft))) return "already in your pool";
        const prior = seen.find((x) => sameCustomRelic(x.draft, draft));
        if (prior) return `also read from ${prior.where}`;
        seen.push({ draft, where: shot.label });
        return null;
      }),
    );
  }, [shots, relics]);

  const addedCount = shots.reduce(
    (n, s) => n + s.relics.filter((r) => r.outcome === "new").length,
    0,
  );

  // Cards that could still put something in the pool. Ones already handled and
  // ones the parser has flagged as repeats don't count — with them in, "Add
  // all" would offer to add a screen of relics that are all already there.
  const pending = shots.some((shot, si) =>
    shot.relics.some((r, ri) => !r.outcome && !dupeNotes[si]?.[ri] && draftFrom(shot, r)),
  );

  /** Ask before throwing away review work that hasn't been acted on yet. */
  const keepPending = () =>
    pending && !window.confirm("Discard these results? Relics you already added stay in your pool.");

  const pick = (files: File[]) => {
    if (keepPending()) return;
    setNotice(
      files.length > MAX_BATCH
        ? `${files.length} picked — reading the first ${MAX_BATCH}. Run it again for the rest.`
        : null,
    );
    void start(files.slice(0, MAX_BATCH));
  };

  const clearAll = () => {
    if (keepPending()) return;
    run.current += 1;
    setShots([]);
    setStatus(null);
    setNotice(null);
  };

  return (
    <div>
      <p className="max-w-prose font-body text-base text-parchment-muted">
        Screenshot the relic rites screen with relic names and effects visible, and drop up to{" "}
        {MAX_BATCH} shots in at once. Each is read on its own, and everything it finds stays
        editable until you add it — the parser is good, not right. Relics you already have, and
        ones that show up twice across the shots, are flagged rather than added again.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-50"
        >
          {shots.length > 0 ? "Choose different screenshots" : `Choose screenshots (up to ${MAX_BATCH})`}
        </button>
        {busy && (
          <button
            type="button"
            onClick={stop}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Stop
          </button>
        )}
        {!busy && shots.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Clear
          </button>
        )}
        {pending && (
          <button
            type="button"
            onClick={addAll}
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            Add all to pool
          </button>
        )}
        {addedCount > 0 && (
          <button
            type="button"
            onClick={onDone}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            {addedCount} added — open My Relics
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          pick(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {notice && <p className="mt-2 font-body text-sm text-gold-dim">{notice}</p>}
      {status && <p className="mt-2 font-body text-sm text-parchment-faint">{status}</p>}
      {busy && (
        <p className="mt-2 max-w-prose font-body text-sm text-parchment-faint">
          Reading happens here in the browser, one screenshot at a time — a phone takes a good deal
          longer than a laptop. You can switch tabs in the app and come back; leaving the page
          gives up on the ones still queued.
        </p>
      )}

      <div className="mt-5 space-y-6">
        {shots.map((shot, si) => (
          <ShotSection
            key={shot.id}
            shot={shot}
            dupeNotes={dupeNotes[si] ?? []}
            onDeep={(deep) => setShotDeep(si, deep)}
            onLine={(ri, li, v) =>
              setRelic(si, ri, (r) => ({
                ...r,
                lines: r.lines.map((l, j) => (j === li ? v : l)),
              }))
            }
            onDemerit={(ri, li, v) =>
              setRelic(si, ri, (r) => ({
                ...r,
                demerits: r.demerits.map((d, j) => (j === li ? v : d)),
              }))
            }
            onSwap={(ri, a, b) =>
              setRelic(si, ri, (r) => ({
                ...r,
                lines: swapLines(r.lines, a, b),
                demerits: swapLines(r.demerits, a, b),
                alternates: swapLines(r.alternates, a, b),
              }))
            }
            onAlternate={(ri, li) =>
              // Trade the line for its runner-up; the old reading becomes the
              // new alternate, so the tap is reversible.
              setRelic(si, ri, (r) => ({
                ...r,
                lines: r.lines.map((l, j) => (j === li ? r.alternates[li] : l)),
                alternates: r.alternates.map((a, j) => (j === li ? r.lines[li] : a)),
              }))
            }
            onColor={(ri, color) =>
              setRelic(si, ri, (r) => ({
                ...r,
                color,
                // A new color can make a "duplicate" a relic the pool doesn't
                // have — let the card be judged again instead of staying skipped.
                outcome: r.outcome === "dupe" ? null : r.outcome,
              }))
            }
            onAddRelic={(ri) => addOne(si, ri)}
            onDropRelic={(ri) => dropRelic(si, ri)}
            onDropShot={() => dropShot(si)}
          />
        ))}
      </div>
    </div>
  );
}

const STATE_LABEL: Record<ShotState, string> = {
  queued: "Waiting",
  reading: "Reading",
  done: "Read",
  failed: "Failed",
  stopped: "Stopped",
};

function ShotSection({
  shot,
  dupeNotes,
  onDeep,
  onLine,
  onDemerit,
  onSwap,
  onAlternate,
  onColor,
  onAddRelic,
  onDropRelic,
  onDropShot,
}: {
  shot: Shot;
  dupeNotes: (string | null)[];
  onDeep: (deep: boolean) => void;
  onLine: (ri: number, li: number, v: string) => void;
  onDemerit: (ri: number, li: number, v: string) => void;
  onSwap: (ri: number, a: number, b: number) => void;
  onAlternate: (ri: number, li: number) => void;
  onColor: (ri: number, color: CustomRelic["color"]) => void;
  onAddRelic: (ri: number) => void;
  onDropRelic: (ri: number) => void;
  onDropShot: () => void;
}) {
  const busy = shot.state === "queued" || shot.state === "reading";
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-night-700 pb-1.5">
        <h4 className="eyebrow text-gold-dim">{shot.label}</h4>
        <span className="font-body text-xs text-parchment-faint">
          {STATE_LABEL[shot.state]}
          {shot.note && ` — ${shot.note}`}
        </span>
        {shot.state === "done" && shot.relics.length > 0 && (
          <div
            className="ml-auto flex overflow-hidden rounded-md border border-night-600"
            role="group"
            aria-label={`Relic kind for ${shot.label}`}
          >
            {([false, true] as const).map((kind) => (
              <button
                key={String(kind)}
                type="button"
                onClick={() => onDeep(kind)}
                aria-pressed={shot.deep === kind}
                className={`px-2.5 py-1 font-body text-xs transition-colors ${
                  shot.deep === kind
                    ? "bg-night-700 text-gold-bright"
                    : "bg-night-900 text-parchment-muted hover:text-parchment"
                }`}
              >
                {kind ? "Deep relics" : "Normal relics"}
              </button>
            ))}
          </div>
        )}
        {!busy && (
          <IconButton label={`Dismiss ${shot.label}`} onClick={onDropShot}>
            <XIcon />
          </IconButton>
        )}
      </div>

      {shot.relics.length > 0 && (
        <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
          {shot.relics.map((r, ri) => {
            const note = dupeNotes[ri];
            // A handled card, and one the parser already knows is a repeat,
            // both collapse to a single line — the editable card has nothing
            // left to do, and the line says why. A repeat keeps its color
            // picker, though: "duplicate" is judged color and all, so a relic
            // that only *reads* like one you have — the wrong color clicked,
            // or a mismatch in the pool — is fixed right here, and correcting
            // it brings the full card back.
            if (r.outcome || note) {
              const settled = r.outcome === "new";
              return (
                <div key={ri} className="frame flex items-center gap-2 rounded-md bg-night-900 p-3">
                  <SlotIconImg color={r.color} size={18} />
                  {!settled && (
                    <select
                      value={r.color}
                      onChange={(e) => onColor(ri, e.target.value as CustomRelic["color"])}
                      aria-label="Relic color"
                      title="Wrong color? Changing it re-checks this card against your pool."
                      className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment"
                    >
                      {RELIC_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="min-w-0 flex-1 font-body text-sm">
                    <span className="text-parchment">{r.name || "Unnamed relic"}</span>{" "}
                    {settled ? (
                      <span className="text-gold-bright">added to your pool ✓</span>
                    ) : (
                      <span className="text-parchment-faint">
                        {note ?? "is already in your pool"} — skipped. Wrong color? Change it to
                        re-check.
                      </span>
                    )}
                  </p>
                  <IconButton label="Dismiss this card" onClick={() => onDropRelic(ri)}>
                    <XIcon />
                  </IconButton>
                </div>
              );
            }
            return (
              <div key={ri} className="frame rounded-md bg-night-900 p-3">
                <div className="flex items-start gap-2">
                  <p className="flex flex-1 items-center gap-2 font-body text-sm text-parchment">
                    {r.name ?? <span className="text-parchment-faint">Unnamed relic</span>}
                    {shot.deep && (
                      <span className="rounded border border-night-500 px-1 font-body text-[0.6rem] uppercase tracking-wide text-gold-dim">
                        Deep
                      </span>
                    )}
                  </p>
                  <IconButton label="Reject this relic" onClick={() => onDropRelic(ri)} danger>
                    <XIcon />
                  </IconButton>
                </div>
                <ReviewLineInputs
                  lines={r.lines}
                  demerits={r.demerits}
                  deep={shot.deep}
                  alternates={r.alternates}
                  onLine={(li, v) => onLine(ri, li, v)}
                  onDemerit={(li, v) => onDemerit(ri, li, v)}
                  onSwap={(a, b) => onSwap(ri, a, b)}
                  onAlternate={(li) => onAlternate(ri, li)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <SlotIconImg color={r.color} size={18} />
                  <select
                    value={r.color}
                    onChange={(e) => onColor(ri, e.target.value as CustomRelic["color"])}
                    aria-label="Relic color"
                    className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment"
                  >
                    {RELIC_COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {/* Lines with a gap in them aren't a relic yet — the note
                      under them says which way to close it. */}
                  <button
                    type="button"
                    disabled={lineGapError(r.lines) !== null}
                    onClick={() => onAddRelic(ri)}
                    className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600 disabled:opacity-40 disabled:hover:bg-night-700"
                  >
                    Add to pool
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
