"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Import view, Build tab: a whole build from screenshots, in one sitting.
//
//  The Relics tab fills the pool and leaves assembling a build for later —
//  which is two visits and a lot of scrolling on a phone. This is the other
//  order: say who you're playing, shoot the Relic Rites screen, correct what
//  the parser misread, and save. The relics it creates land in the pool as a
//  side effect of saving the build, not as a separate errand.
//
//  Duplicates are settled *after* the save rather than during it: mid-flow
//  the lines are still being corrected, so a relic that looks like a repeat
//  one keystroke ago isn't one the next. Exact repeats reuse the pool entry
//  outright; near-misses are offered as a choice, since the difference is
//  either a misread or a genuinely different roll and only the player knows.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { characterChalices } from "@/data/chalices";
import { bestLineMatch, similarity } from "@/lib/effectMatch";
import {
  fixedRelics,
  matchFixedByEffects,
  newId,
  sameCustomRelic,
  type Build,
  type BuildSlot,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
} from "@/lib/builds";
import type { Chalice, SlotColor } from "@/lib/chalices";
import {
  RELIC_COLORS,
  CharacterImg,
  CharacterTile,
  EffectLines,
  IconButton,
  ReviewLineInputs,
  SlotIconImg,
  StepTrail,
  XIcon,
  chalicesFor,
  colorFromRelicName,
  hasLineGap,
  lineGapError,
  readScreenshot,
  startOcrSession,
  swapLines,
  type OcrSession,
  type ScreenshotRead,
} from "./shared";

/** Slot 1–3, then Deep 1–3 — the build's six sockets, in one flat list. */
const SLOT_LABELS = ["Slot 1", "Slot 2", "Slot 3", "Deep 1", "Deep 2", "Deep 3"] as const;

/** How alike two relics' lines must read before the save offers to merge them. */
const NEAR_DUPE_SCORE = 0.75;

/**
 * Screenshots per batch. Reading one is seconds on a laptop but tens of
 * seconds on a phone, and every one decodes a full-resolution image. Six is
 * the whole build — more than that in one go is a wait with nowhere left to
 * put the results.
 */
const MAX_BATCH = 6;

/**
 * Which set a batch fills. "auto" lets each screenshot decide for itself — a
 * Deep of Night screen gives itself away by its curses and deep-only effects
 * — which is what the plain "add screenshots" button uses, since sorting your
 * own shots into two piles is work the parser can mostly do.
 */
type Target = "auto" | "normal" | "deep";

/**
 * The flow, in order. Nightfarer and vessel come from pickers rather than
 * from a screenshot: both are one tap here, where the vessel screen would
 * want its own carefully cropped shot — and the vessel's sockets decide what
 * color each relic ends up, so it's worth having before the relics land.
 */
const STEPS = ["character", "vessel", "shots", "review"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  character: "Nightfarer",
  vessel: "Vessel",
  shots: "Screenshots",
  review: "Review & save",
};

/** One relic on its way into a slot — every line stays editable until saved. */
interface Draft {
  /** Stable across edits and moves, so inputs keep focus. */
  key: string;
  name: string;
  /** Three entries — "" where the screenshot had no line. */
  lines: string[];
  /** demerits[i] belongs to lines[i]; only Deep relics carry them. */
  demerits: string[];
  /** Color sampled off the relic's icon, where it could be read. */
  read: CustomRelic["color"] | null;
  /**
   * The color chosen by hand, which only a White socket ever needs — a
   * colored socket dictates its relic's color, so there is nothing to choose.
   * Null falls back to the sampled color (see relicColor).
   */
  color: CustomRelic["color"] | null;
  /**
   * Recognized as one of the app's own fixed relics (a boss drop, a shop
   * relic, a signboard swap). Its effects are known, so they're shown rather
   * than edited — and the build points at the relic itself, not a copy.
   */
  fixed: string | null;
  /**
   * A fixed relic these lines are an exact copy of, where every one of them
   * could also have rolled — so it might be that relic, or a roll that landed
   * the same way. Offered on the card rather than applied: nobody but the
   * player knows which, and guessing wrong silently is the worse mistake.
   */
  suggest: string | null;
}

type Slots = (Draft | null)[];

const EMPTY_DRAFTS: Slots = [null, null, null, null, null, null];

/**
 * The color a draft's relic ends up. A colored socket decides outright — the
 * game won't seat a Red relic in a Blue socket, so the socket is the better
 * authority than an icon sampled off a screenshot with a blue cast over it.
 * A White socket takes anything, so there the relic carries its own color:
 * what was picked by hand, else what was sampled, else what its name gives
 * away, else Red as a visible default the picker can correct.
 */
function relicColor(d: Draft, socket: SlotColor): CustomRelic["color"] {
  if (socket !== "White") return socket as CustomRelic["color"];
  return d.color ?? d.read ?? colorFromRelicName(d.name) ?? "Red";
}

/** A draft's effect/demerit pairs, normalized — its identity for comparing. */
function draftLines(d: Draft): string {
  return d.lines
    .map((l, i) => `${l.trim().toLowerCase()}|${(d.demerits[i] ?? "").trim().toLowerCase()}`)
    .filter((l) => l !== "|")
    .join("\n");
}

/** Whether two drafts are the same relic read twice. */
function sameDraft(a: Draft, b: Draft): boolean {
  const lines = draftLines(a);
  return lines !== "" && lines === draftLines(b);
}

/** A relic the save created next to one the pool already held. */
interface NearDupe {
  /** The relic just added — the one that would go away on a merge. */
  added: CustomRelic;
  /** The pool relic it reads like. */
  existing: CustomRelic;
  /** Settled by the user, and how. */
  outcome: "merged" | "kept" | null;
}

interface SaveResult {
  buildId: string;
  buildName: string;
  /** Relics this save put in the pool. */
  added: CustomRelic[];
  /** Relics that were already there, reused rather than copied. */
  reused: number;
  near: NearDupe[];
}

/** A relic's lines as one string, for comparing two rolls at a glance. */
function linesText(r: Pick<CustomRelic, "effects" | "demerits">): string {
  return r.effects
    .map((e, i) => `${e.trim()} ${(r.demerits?.[i] ?? "").trim()}`.trim())
    .filter(Boolean)
    .join(" | ");
}

/** A tier suffix, as the game prints it on an effect: "+1", "+2", "+3". */
const TIER_SUFFIX = /\s*\+\d\b/g;

/**
 * Whether two relics carry the same effects at different tiers. "Ultimate Art
 * Auto Charge +2" and "… +3" sit one character apart and so read as very
 * nearly the same relic — but a tier is a value, not a misreading of one.
 * Those two are different rolls, with nothing to merge and nothing to ask.
 */
function differsOnlyByTier(
  a: Pick<CustomRelic, "effects" | "demerits">,
  b: Pick<CustomRelic, "effects" | "demerits">,
): boolean {
  const at = linesText(a);
  const bt = linesText(b);
  return at !== bt && at.replace(TIER_SUFFIX, "") === bt.replace(TIER_SUFFIX, "");
}

/**
 * The pool relic each newly added relic reads most like, where that's close
 * enough to be worth asking about but not identical (identical ones never get
 * here — they're reused during the save). Same color and same deep-ness are
 * required: a Red relic is not a misread of a Blue one, and neither is a relic
 * that matches line for line but for a tier.
 */
function nearDupes(added: CustomRelic[], pool: CustomRelic[]): NearDupe[] {
  const out: NearDupe[] = [];
  for (const a of added) {
    const text = linesText(a);
    if (!text) continue;
    let best: { relic: CustomRelic; score: number } | null = null;
    for (const p of pool) {
      if (p.color !== a.color || !!p.deep !== !!a.deep) continue;
      if (differsOnlyByTier(a, p)) continue;
      const score = similarity(text, linesText(p));
      if (score >= NEAR_DUPE_SCORE && score < 1 && (!best || score > best.score)) {
        best = { relic: p, score };
      }
    }
    if (best) out.push({ added: a, existing: best.relic, outcome: null });
  }
  return out;
}

export function ImportBuild({
  store,
  onAddRelic,
  onSaveBuild,
  onOpenBuild,
  onMergeRelic,
}: {
  store: BuildStore;
  onAddRelic: (r: CustomRelic) => void;
  /** Save the build without leaving this view — the dedupe pass follows it. */
  onSaveBuild: (b: Build) => void;
  onOpenBuild: (id: string) => void;
  /** Point a saved build's slots at `to` and drop the relic `from`. */
  onMergeRelic: (buildId: string, from: string, to: string) => void;
}) {
  const [step, setStep] = useState<Step>("character");
  const [character, setCharacter] = useState<string>(characterChalices[0].name);
  const [chaliceName, setChaliceName] = useState<string | null>(null);
  // A vessel the player picked outranks anything a later screenshot reads.
  const [chaliceTouched, setChaliceTouched] = useState(false);
  const [chaliceGuess, setChaliceGuess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<Slots>(EMPTY_DRAFTS);
  // The sockets as they stand right now. A batch fills them one screenshot at
  // a time and each read has to see what the ones before it put down — and the
  // user can be editing lines on the review screen while a read is still
  // going, so a snapshot taken when the batch started would clobber them.
  // Every change goes through patchDrafts to keep the two in step.
  const draftsRef = useRef<Slots>(EMPTY_DRAFTS);
  const patchDrafts = (fn: (ds: Slots) => Slots) => {
    draftsRef.current = fn(draftsRef.current);
    setDrafts(draftsRef.current);
  };
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** One line per screenshot read this session — what it gave, or why not. */
  const [reads, setReads] = useState<{ label: string; note: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  // Which set the next picked files fill — set by the button that opens the
  // picker. "auto" lets each screenshot's own contents decide.
  const target = useRef<Target>("auto");
  const fileRef = useRef<HTMLInputElement>(null);
  // Bumped to abandon a run in flight, so its late results are dropped.
  const run = useRef(0);
  const session = useRef<OcrSession | null>(null);

  // Leaving the page mid-read takes the worker down with it — a tesseract
  // worker left running holds its WASM heap for the rest of the visit.
  useEffect(
    () => () => {
      run.current += 1;
      void session.current?.terminate();
      session.current = null;
    },
    [],
  );

  const chalices = chalicesFor(character);
  const chalice: Chalice = chalices.find((c) => c.name === chaliceName) ?? chalices[0];
  /** The socket color at flat index i (0–2 normal, 3–5 Deep). */
  const socketAt = (i: number) => (i < 3 ? chalice.slots[i] : chalice.deep[i - 3]);

  const setDraft = (i: number, fn: (d: Draft) => Draft) =>
    patchDrafts((ds) => ds.map((d, j) => (j === i && d ? fn(d) : d)));

  const pickCharacter = (who: string) => {
    setCharacter(who);
    // Vessels are per-Nightfarer, so the old pick can't survive the change.
    if (who !== character) {
      setChaliceName(null);
      setChaliceTouched(false);
      setChaliceGuess(null);
    }
    setStep("vessel");
  };

  const pickChalice = (name: string) => {
    setChaliceName(name);
    setChaliceTouched(true);
    setStep("shots");
  };

  // ── Reading screenshots ────────────────────────────────────────────────
  const openPicker = (into: Target) => {
    target.current = into;
    fileRef.current?.click();
  };

  /**
   * Read a batch of screenshots and let what they hold settle into the six
   * sockets. They go through one tesseract worker one after another —
   * spinning up a worker re-instantiates the WASM engine, and decoding
   * several full-resolution images at once is what gets a phone's tab killed.
   * Each screenshot's relics land the moment it finishes, so stopping
   * part-way only costs the ones still queued.
   */
  const readShots = async (files: File[], into: Target) => {
    if (busy || files.length === 0) return;
    const mine = ++run.current;
    const say = (s: string) => {
      if (run.current === mine) setStatus(s);
    };
    setBusy(true);
    setNotice(
      files.length > MAX_BATCH
        ? `${files.length} picked — reading the first ${MAX_BATCH}. Add the rest after.`
        : null,
    );
    const batch = files.slice(0, MAX_BATCH);
    setStatus("Starting…");
    let mySession: OcrSession | null = null;
    let landed = 0;
    try {
      mySession = await startOcrSession(say);
      session.current = mySession;
      for (let i = 0; i < batch.length; i++) {
        if (run.current !== mine) break;
        const label = batch[i].name || `Screenshot ${i + 1}`;
        const where = batch.length > 1 ? `${i + 1} of ${batch.length} — ` : "";
        try {
          // A set holds exactly three relics, so anything past the third
          // group in one shot is spillover — a doubled line, or a detail pane.
          const read = await readScreenshot(
            batch[i],
            (s) => say(`${where}${s}`),
            { session: mySession, maxGroups: 3 },
          );
          if (run.current !== mine) break;
          const note = absorb(read, into);
          landed += note.added;
          setReads((rs) => [...rs, { label, note: note.text }]);
        } catch {
          // One unreadable file — an odd format, or a decode that ran out of
          // memory — mustn't take the rest of the batch down with it.
          if (run.current !== mine) break;
          setReads((rs) => [
            ...rs,
            { label, note: "couldn't be read — a PNG or JPEG screenshot works best" },
          ]);
        }
      }
      if (run.current !== mine) return;
      setStatus(null);
      if (landed > 0) setStep("review");
    } catch {
      if (run.current === mine) {
        setStatus(null);
        setNotice("Couldn't start the parser — check your connection and try again.");
      }
    } finally {
      // Only ever one run in flight (see busy), so this is always ours.
      setBusy(false);
      await mySession?.terminate();
      if (session.current === mySession) session.current = null;
    }
  };

  /**
   * Put one screenshot's relics into the next free sockets, and say what
   * happened to them. Overlapping shots of the same screen re-read the same
   * relic, so anything already down is passed over rather than filling a
   * second socket with a copy of it.
   */
  const absorb = (read: ScreenshotRead, into: Target): { added: number; text: string } => {
    // Which set they belong in: the button that opened the picker decides,
    // unless it left it to the screenshot — a Deep screen gives itself away
    // by its curses and its deep-only effects.
    const deep = into === "auto" ? read.deep : into === "deep";
    const base = deep ? 3 : 0;
    let added = 0;
    let repeats = 0;
    let overflow = 0;
    // Built off the ref rather than inside the updater: React may run an
    // updater twice, and these counts have to be right the once.
    const next = [...draftsRef.current];
    // A fixed relic is a single in-game item, so one already down can't be
    // read into a second socket — that read is a misread, and falls back to
    // an editable custom relic with what was scanned kept for correcting.
    const claimed = new Set(next.flatMap((d) => (d?.fixed ? [d.fixed] : [])));
    for (const r of read.relics.slice(0, 3)) {
      const draft: Draft = {
        key: newId(),
        name: r.name ?? "",
        lines: r.effects,
        demerits: r.demerits,
        read: r.color,
        color: null,
        fixed: null,
        suggest: null,
      };
      if (!draftLines(draft)) continue; // nothing but a header
      if (next.some((d) => d && sameDraft(d, draft))) {
        repeats++;
        continue;
      }
      const free = [0, 1, 2].map((j) => base + j).find((k) => !next[k]);
      if (free === undefined) {
        overflow++;
        continue;
      }
      if (!deep) {
        const byName = draft.name ? fixedRelics.find((f) => f.name === draft.name) : null;
        // No name off the screenshot? An effect that can't roll on a random
        // relic still pins it to its fixed relic outright. Deep sockets take
        // none of them — every Depth relic is a random roll.
        const byEffects = byName ? null : matchFixedByEffects(draft.lines);
        const hit = byName ?? (byEffects?.certain ? byEffects.relic : null);
        if (hit && !claimed.has(hit.name)) {
          draft.fixed = hit.name;
          claimed.add(hit.name);
        } else if (!hit && byEffects && !claimed.has(byEffects.relic.name)) {
          // Every line could have rolled, but together they're an exact copy
          // of a fixed relic. Say so on the card and let the player answer.
          draft.suggest = byEffects.relic.name;
        }
      }
      next[free] = draft;
      added++;
    }
    if (added > 0) patchDrafts(() => next);
    // A screenshot that happens to catch the vessel's name is worth noting
    // even though the vessel was chosen two steps ago — if the two disagree,
    // one of them is a different loadout than the one being built. It only
    // *sets* the vessel where nothing has chosen one, which these days means
    // a flow someone skipped their way through.
    const seen = bestLineMatch(read.lines, chalices.map((c) => c.name));
    let vessel = "";
    if (seen) {
      setChaliceGuess(seen.effect);
      if (!chaliceTouched) {
        setChaliceName(seen.effect);
        vessel = `, vessel read as ${seen.effect}`;
      }
    }
    const parts = [
      added > 0
        ? `${added} relic${added === 1 ? "" : "s"} into ${deep ? "Deep" : "the normal"} sockets`
        : "",
      repeats > 0 ? `${repeats} already read` : "",
      overflow > 0 ? `${overflow} with no free socket left` : "",
    ].filter(Boolean);
    return {
      added,
      text:
        (parts.length > 0
          ? parts.join(", ")
          : "nothing recognized — the relic name and every effect line need to be readable") + vessel,
    };
  };

  // Give up on what's left. Screenshots already read keep what they put down;
  // the one in flight finishes reading before its worker can be taken down,
  // but its result is dropped along with everything still queued.
  const stop = () => {
    run.current += 1;
    setBusy(false);
    setStatus(null);
    setNotice("Stopped — the screenshots still queued weren't read.");
  };

  // ── Rearranging what was read ──────────────────────────────────────────
  const clearSlot = (i: number) => patchDrafts((ds) => ds.map((d, j) => (j === i ? null : d)));

  /** Move a relic to another socket, trading places with whatever's there. */
  const moveTo = (from: number, to: number) =>
    patchDrafts((ds) => {
      const next = [...ds];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const swapSets = () => patchDrafts((ds) => [...ds.slice(3), ...ds.slice(0, 3)]);

  const filled = drafts.filter(Boolean).length;

  // ── Saving ─────────────────────────────────────────────────────────────
  const save = () => {
    // A move can leave a gap in a socket's lines. The card says so itself, but
    // the save is one button for all six, so it has to name the one at fault.
    // A socket left empty isn't a gap — it's an empty socket, which saves fine
    // — and a fixed relic outside the Deep set never reads its lines at all.
    const gap = drafts.findIndex((d, i) => d && !(d.fixed && i < 3) && hasLineGap(d.lines));
    if (gap !== -1) {
      setNotice(`${SLOT_LABELS[gap]}: ${lineGapError(drafts[gap]!.lines)}`);
      return;
    }
    // The pool as it stands *before* this save — what the new relics are
    // weighed against, both for exact repeats and for the near-misses below.
    const pool = store.customRelics;
    const added: CustomRelic[] = [];
    let reused = 0;
    const slots = drafts.map((d, i): BuildSlot => {
      if (!d) return null;
      const deep = i >= 3;
      if (d.fixed && !deep) return { kind: "fixed", name: d.fixed };
      // Keep effect/demerit pairs together; drop pairs with no effect text.
      const kept = [0, 1, 2].filter((j) => (d.lines[j] ?? "").trim());
      if (kept.length === 0) return null;
      const color = relicColor(d, socketAt(i));
      const draft = {
        name: d.name.trim(),
        color,
        effects: kept.map((j) => d.lines[j].trim()),
        demerits: kept.map((j) => (deep ? (d.demerits[j] ?? "").trim() : "")),
        deep,
      };
      // The same relic owned once and slotted twice is one pool entry, and a
      // relic already in the pool is that same entry again.
      const already =
        pool.find((r) => sameCustomRelic(r, draft)) ?? added.find((r) => sameCustomRelic(r, draft));
      if (already) {
        reused++;
        return { kind: "custom", id: already.id };
      }
      const relic: CustomRelic = { id: newId(), ...draft };
      added.push(relic);
      return { kind: "custom", id: relic.id };
    });
    added.forEach(onAddRelic);
    const build: Build = {
      id: newId(),
      name: name.trim() || `${character} build`,
      character,
      chalice: chalice.name,
      slots: slots.slice(0, 3) as SlotTriple,
      deepSlots: slots.slice(3, 6) as SlotTriple,
      notes: "",
      updatedAt: Date.now(),
    };
    onSaveBuild(build);
    setResult({
      buildId: build.id,
      buildName: build.name,
      added,
      reused,
      near: nearDupes(added, pool),
    });
  };

  const merge = (i: number) => {
    if (!result) return;
    const pair = result.near[i];
    onMergeRelic(result.buildId, pair.added.id, pair.existing.id);
    setResult((r) =>
      r ? { ...r, near: r.near.map((n, j) => (j === i ? { ...n, outcome: "merged" } : n)) } : r,
    );
  };

  const keepBoth = (i: number) =>
    setResult((r) =>
      r ? { ...r, near: r.near.map((n, j) => (j === i ? { ...n, outcome: "kept" } : n)) } : r,
    );

  /** Start over on another build — the Nightfarer is usually the same one. */
  const again = () => {
    setResult(null);
    patchDrafts(() => EMPTY_DRAFTS);
    setReads([]);
    setName("");
    setChaliceName(null);
    setChaliceTouched(false);
    setChaliceGuess(null);
    setNotice(null);
    setStatus(null);
    // Back to the vessel, not the screenshots — the next build is usually the
    // same Nightfarer in a different vessel, and there's no vessel chosen now.
    setStep("vessel");
  };

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        void readShots(Array.from(e.target.files ?? []), target.current);
        e.target.value = "";
      }}
    />
  );

  // ── Saved: the build exists, and repeats get settled ───────────────────
  if (result) {
    return (
      <SavedPanel
        result={result}
        onOpen={() => onOpenBuild(result.buildId)}
        onMerge={merge}
        onKeepBoth={keepBoth}
        onAgain={again}
      />
    );
  }

  // One step back, at the top where a back control belongs — the stepper
  // under it says where that is, so this only has to be easy to hit.
  const backTo: Step | null = STEPS[STEPS.indexOf(step) - 1] ?? null;

  return (
    <div>
      {backTo && (
        <button
          type="button"
          onClick={() => setStep(backTo)}
          className="frame mb-4 rounded-md bg-night-800 px-4 py-2.5 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          ← Back to {STEP_LABELS[backTo]}
        </button>
      )}
      <StepTrail steps={STEPS.map((k) => STEP_LABELS[k])} at={STEPS.indexOf(step)} />

      {step === "character" && (
        <section>
          <h4 className="font-display text-lg text-parchment">Who are you building for?</h4>
          <p className="mt-1 max-w-prose font-body text-base text-parchment-muted">
            Vessels and their sockets are per-Nightfarer, so this comes first — everything the
            screenshots fill in after it is checked against this character&rsquo;s vessels.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {characterChalices.map((c) => (
              <CharacterTile
                key={c.name}
                name={c.name}
                // Highlighted when you come back through "change" — the one the
                // flow is already on, rather than a selection you have to make.
                active={character === c.name && filled > 0}
                onPick={() => pickCharacter(c.name)}
              />
            ))}
          </div>
          {filled > 0 && (
            <p className="mt-3 max-w-prose font-body text-base text-gold-dim">
              Picking a different Nightfarer keeps the relics you&rsquo;ve read so far, but the
              vessel starts over — its sockets belong to the character.
            </p>
          )}
        </section>
      )}

      {step === "vessel" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CharacterImg name={character} size={28} />
            <span className="font-display text-lg text-parchment">{character}</span>
          </div>

          <h4 className="font-display text-lg text-parchment">Which vessel?</h4>
          <p className="mt-1 max-w-prose font-body text-base text-parchment-muted">
            Two taps here beats a screenshot: the vessel&rsquo;s name sits in a corner of its own
            screen, so shooting it means cropping. Its sockets decide what color each relic ends
            up, so it&rsquo;s worth having before the relics land — and it stays changeable right
            up until you save.
          </p>
          <div className="mt-4 space-y-1.5">
            {chalices.map((c) => {
              const active = chaliceName === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => pickChalice(c.name)}
                  aria-pressed={active}
                  className={`frame flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left font-body text-base transition-colors ${
                    active
                      ? "bg-night-700 text-gold-bright"
                      : "bg-night-900 text-parchment hover:bg-night-800 hover:text-gold-bright"
                  }`}
                  style={active ? { borderColor: "#c9a227" } : undefined}
                >
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {c.slots.map((s, i) => (
                      <SlotIconImg key={`n${i}`} color={s} size={18} />
                    ))}
                    <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
                    {c.deep.map((s, i) => (
                      <span key={`d${i}`} className="opacity-60">
                        <SlotIconImg color={s} size={18} />
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-body text-base text-parchment-faint">
            Bright icons: normal sockets · dimmed: Deep of Night
          </p>
        </section>
      )}

      {step === "shots" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CharacterImg name={character} size={28} />
            <span className="font-display text-lg text-parchment">{character}</span>
            <span className="font-body text-base text-parchment-muted">· {chalice.name}</span>
            <span className="flex items-center gap-0.5">
              {chalice.slots.map((s, i) => (
                <SlotIconImg key={i} color={s} size={16} />
              ))}
            </span>
          </div>

          <h4 className="font-display text-lg text-parchment">Snap your relics</h4>
          <ol className="mt-2 max-w-prose list-decimal space-y-1.5 pl-5 font-body text-base text-parchment-muted">
            <li>
              In game, open <span className="text-parchment">Relic Rites</span> and bring a relic
              up so its name and every one of its effect lines is readable.
            </li>
            <li>
              Screenshot it, then do the same for the next one. One relic per shot is the easy
              way — you can add as many as it takes, and none of it has to fit in a single
              frame. Anything cut off is a line you&rsquo;ll be typing yourself.
            </li>
            <li>
              Deep of Night relics can go in the same pile — a Deep screen gives itself away, and
              anything that lands in the wrong socket can be moved.
            </li>
            <li>
              A photo of a screen works too — hold it square on and close, and keep the glare off.
            </li>
          </ol>
          <p className="mt-2 max-w-prose font-body text-base text-parchment-muted">
            Reading happens here in your browser, so a phone takes a while — figure on the better
            part of a minute per screenshot. They&rsquo;re read one at a time and land as they
            finish, so you can add a couple, see what they gave, and carry on.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => openPicker("auto")}
              className="rounded-md border border-gold-bright bg-gold px-5 py-3 font-display text-base font-semibold text-night-950 shadow-seal transition hover:bg-gold-bright disabled:opacity-50"
            >
              {filled > 0 ? "Add more screenshots" : "Add screenshots"}
            </button>
            {busy && (
              <button
                type="button"
                onClick={stop}
                className="frame rounded-md bg-night-800 px-4 py-3 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
              >
                Stop
              </button>
            )}
            {!busy && (
              <button
                type="button"
                onClick={() => setStep("review")}
                className="frame rounded-md bg-night-800 px-4 py-3 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
              >
                {filled > 0 ? "Review & save →" : "Skip — fill it in by hand"}
              </button>
            )}
          </div>
          {status && <p className="mt-2 font-body text-base text-parchment-faint">{status}</p>}
          {notice && <p className="mt-2 font-body text-base text-gold-dim">{notice}</p>}

          {(filled > 0 || reads.length > 0) && (
            <FillSummary
              drafts={drafts}
              reads={reads}
              socketAt={socketAt}
              vessel={chalice.name}
              // A screenshot naming a different vessel than the one picked:
              // worth saying, since the sockets it implies are different ones.
              disagrees={chaliceGuess && chaliceGuess !== chalice.name ? chaliceGuess : null}
              onUseVessel={pickChalice}
              onAddInto={openPicker}
              onClear={clearSlot}
              busy={busy}
            />
          )}
          {fileInput}
        </section>
      )}

      {step === "review" && (
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <CharacterImg name={character} size={28} />
            <span className="font-display text-lg text-parchment">{character}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this build"
              aria-label="Build name"
              className="frame w-full rounded bg-night-900 px-3 py-2.5 font-display text-lg text-parchment placeholder:text-parchment-faint sm:w-64"
            />
            <label className="flex flex-1 items-center gap-2">
              <span className="sr-only">Vessel</span>
              <select
                value={chalice.name}
                onChange={(e) => {
                  setChaliceName(e.target.value);
                  setChaliceTouched(true);
                }}
                className="frame w-full min-w-0 rounded bg-night-900 px-3 py-2.5 font-body text-base text-parchment sm:w-auto"
              >
                {chalices.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — {c.slots.join(" · ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {chaliceGuess && chaliceGuess !== chalice.name && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 font-body text-base text-gold-dim">
              One of the screenshots names <span className="text-parchment">{chaliceGuess}</span>{" "}
              instead.
              <button
                type="button"
                onClick={() => {
                  setChaliceName(chaliceGuess);
                  setChaliceTouched(true);
                }}
                className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
              >
                Use that one
              </button>
            </p>
          )}
          {notice && <p className="mt-1.5 font-body text-base text-gold-dim">{notice}</p>}

          <p className="mt-4 max-w-prose font-body text-base text-parchment-muted">
            Fix anything the parser got wrong — the effect boxes suggest as you type. Each relic
            takes the color of the socket it&rsquo;s in, so if a color looks off, the relic is
            probably in the wrong socket.
          </p>

          {[false, true].map((deep) => {
            const base = deep ? 3 : 0;
            const any = drafts.slice(base, base + 3).some(Boolean);
            return (
              <div key={String(deep)} className="mt-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-night-700 pb-1.5">
                  <h4 className={`eyebrow ${deep ? "text-gold-dim" : ""}`}>
                    {deep ? "Deep of Night Slots" : "Relic Slots"}
                  </h4>
                  {!deep && filled > 0 && (
                    <button
                      type="button"
                      onClick={swapSets}
                      title="Move the normal relics into the Deep sockets and back"
                      className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
                    >
                      Swap the two sets
                    </button>
                  )}
                  {drafts.slice(base, base + 3).some((d) => !d) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openPicker(deep ? "deep" : "normal")}
                      title={`Read more screenshots into ${
                        deep ? "the Deep of Night sockets" : "these sockets"
                      } — they fill whichever are still empty`}
                      className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright disabled:opacity-50"
                    >
                      {any ? "+ Add another screenshot" : "+ Add screenshots"}
                    </button>
                  )}
                </div>
                <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2].map((j) => {
                    const i = base + j;
                    return (
                      <SlotCard
                        key={drafts[i]?.key ?? `empty-${i}`}
                        label={SLOT_LABELS[i]}
                        socket={socketAt(i)}
                        deep={deep}
                        draft={drafts[i]}
                        others={SLOT_LABELS.map((l, k) => ({ label: l, index: k })).filter(
                          (o) => o.index !== i,
                        )}
                        onName={(v) => setDraft(i, (d) => ({ ...d, name: v }))}
                        onLine={(li, v) =>
                          setDraft(i, (d) => ({
                            ...d,
                            lines: d.lines.map((l, k) => (k === li ? v : l)),
                          }))
                        }
                        onDemerit={(li, v) =>
                          setDraft(i, (d) => ({
                            ...d,
                            demerits: d.demerits.map((x, k) => (k === li ? v : x)),
                          }))
                        }
                        onSwap={(a, b) =>
                          setDraft(i, (d) => ({
                            ...d,
                            lines: swapLines(d.lines, a, b),
                            demerits: swapLines(d.demerits, a, b),
                          }))
                        }
                        onUnfix={() => setDraft(i, (d) => ({ ...d, fixed: null }))}
                        onColor={(c) => setDraft(i, (d) => ({ ...d, color: c }))}
                        onUseSuggested={() =>
                          setDraft(i, (d) => ({ ...d, fixed: d.suggest, suggest: null }))
                        }
                        onMove={(to) => moveTo(i, to)}
                        onClear={() => clearSlot(i)}
                        onFill={() =>
                          patchDrafts((ds) =>
                            ds.map((d, k) =>
                              k === i
                                ? {
                                    key: newId(),
                                    name: "",
                                    lines: ["", "", ""],
                                    demerits: ["", "", ""],
                                    read: null,
                                    color: null,
                                    fixed: null,
                                    suggest: null,
                                  }
                                : d,
                            ),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {status && <p className="mt-3 font-body text-base text-parchment-faint">{status}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={filled === 0 || busy}
              className="rounded-md border border-gold-bright bg-gold px-6 py-3 font-display text-base font-semibold text-night-950 shadow-seal transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save this build
            </button>
            <span className="font-body text-base text-parchment-muted">
              {filled === 0
                ? "Nothing in the sockets yet."
                : "Relics will be saved under My Relics, but exact colour and effect duplicates will be discarded."}
            </span>
          </div>
          {fileInput}
        </section>
      )}
    </div>
  );
}

/**
 * What the screenshots have filled in so far, and what's still open. Shown on
 * the screenshot step itself: a build takes several shots, and between them
 * the question is always the same one — which sockets have I done, and what
 * did the parser actually get out of them.
 *
 * Read-only on purpose. Correcting lines happens once, on the review step,
 * with the whole build in front of you; here the only edit is throwing a bad
 * read away and shooting it again.
 */
function FillSummary({
  drafts,
  reads,
  socketAt,
  vessel,
  disagrees,
  onUseVessel,
  onAddInto,
  onClear,
  busy,
}: {
  drafts: Slots;
  reads: { label: string; note: string }[];
  socketAt: (i: number) => SlotColor;
  /** The vessel chosen back on step 2. */
  vessel: string;
  /** A different vessel a screenshot named, or null when none disagrees. */
  disagrees: string | null;
  onUseVessel: (name: string) => void;
  onAddInto: (into: Target) => void;
  onClear: (i: number) => void;
  busy: boolean;
}) {
  const count = (base: number) => drafts.slice(base, base + 3).filter(Boolean).length;
  return (
    <section className="mt-6">
      <h5 className="eyebrow mb-2 border-b border-night-700 pb-1.5 text-gold-dim">Filled so far</h5>
      <p className="max-w-prose font-body text-base text-parchment-muted">
        <span className="text-parchment">{count(0)} of 3</span> relic sockets and{" "}
        <span className="text-parchment">{count(3)} of 3</span> Deep of Night sockets.
        {count(3) === 0 && " Deep sockets are optional — plenty of builds leave them empty."}
      </p>
      <p className="mt-1 font-body text-base text-parchment-muted">
        Vessel: <span className="text-parchment">{vessel}</span>
      </p>
      {disagrees && (
        <p className="mt-1 flex flex-wrap items-center gap-2 font-body text-base text-gold-dim">
          One of the screenshots names <span className="text-parchment">{disagrees}</span> instead.
          <button
            type="button"
            onClick={() => onUseVessel(disagrees)}
            className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
          >
            Use that one
          </button>
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {[0, 3].map((base) => (
          <div key={base}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h6 className={`eyebrow ${base === 3 ? "text-gold-dim" : ""}`}>
                {base === 3 ? "Deep of Night Slots" : "Relic Slots"}
              </h6>
              {count(base) < 3 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAddInto(base === 3 ? "deep" : "normal")}
                  title={`Read screenshots straight into ${
                    base === 3 ? "the Deep of Night sockets" : "these sockets"
                  }, whatever they look like`}
                  className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright disabled:opacity-50"
                >
                  + Add straight into these
                </button>
              )}
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((j) => {
                const i = base + j;
                const d = drafts[i];
                const socket = socketAt(i);
                const shown = d && !d.fixed ? relicColor(d, socket) : socket;
                if (!d) {
                  return (
                    <div
                      key={i}
                      className="frame flex items-center gap-2 rounded-md bg-night-900/50 p-2.5"
                    >
                      <SlotIconImg color={socket} size={18} />
                      <span className="font-body text-base text-parchment-faint">
                        {SLOT_LABELS[i]} — still to fill
                      </span>
                    </div>
                  );
                }
                const lines = d.fixed
                  ? (fixedRelics.find((r) => r.name === d.fixed)?.effects ?? []).map((text) => ({
                      text,
                    }))
                  : d.lines
                      .map((text, k) => ({ text, demerit: d.demerits[k]?.trim() || undefined }))
                      .filter((l) => l.text.trim());
                return (
                  <div key={d.key} className="frame rounded-md bg-night-900 p-2.5">
                    <div className="flex items-center gap-2">
                      <SlotIconImg color={shown} size={18} />
                      <span className="font-body text-sm uppercase tracking-wide text-parchment-faint">
                        {SLOT_LABELS[i]}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-body text-base text-parchment">
                        {d.fixed || d.name || "Unnamed relic"}
                      </span>
                      <IconButton label={`Throw away what ${SLOT_LABELS[i]} read`} onClick={() => onClear(i)}>
                        <XIcon />
                      </IconButton>
                    </div>
                    <EffectLines lines={lines} size="sm" className="mt-1.5 space-y-0.5" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {reads.length > 0 && (
        <>
          <h6 className="eyebrow mb-1.5 mt-5 text-parchment-faint">Screenshots read</h6>
          <ul className="space-y-0.5">
            {reads.map((r, i) => (
              <li key={i} className="font-body text-base text-parchment-faint">
                <span className="text-parchment-muted">{r.label}</span> — {r.note}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** One socket: what's in it, editable, plus where else it could go. */
function SlotCard({
  label,
  socket,
  deep,
  draft,
  others,
  onName,
  onLine,
  onDemerit,
  onSwap,
  onUnfix,
  onColor,
  onUseSuggested,
  onMove,
  onClear,
  onFill,
}: {
  label: string;
  socket: Chalice["slots"][number];
  deep: boolean;
  draft: Draft | null;
  others: { label: string; index: number }[];
  onName: (v: string) => void;
  onLine: (index: number, v: string) => void;
  onDemerit: (index: number, v: string) => void;
  onSwap: (a: number, b: number) => void;
  onUnfix: () => void;
  /** Set the relic's own color — only ever asked for a White socket. */
  onColor: (c: CustomRelic["color"]) => void;
  /** Take up the fixed relic the lines look like an exact copy of. */
  onUseSuggested: () => void;
  onMove: (to: number) => void;
  onClear: () => void;
  onFill: () => void;
}) {
  const fixed = draft?.fixed ? fixedRelics.find((r) => r.name === draft.fixed) : null;
  // The sampled color disagreeing with the socket usually means the relics
  // came off the screenshot in a different order than the sockets run.
  const mismatch =
    draft && !fixed && draft.read && socket !== "White" && draft.read !== socket ? draft.read : null;
  // What the relic will actually be, so the icon on the card matches what
  // gets saved — a White socket otherwise draws white for every relic in it.
  const shown: SlotColor = draft && !fixed ? relicColor(draft, socket) : socket;

  if (!draft) {
    return (
      <div className="frame flex items-center gap-2 rounded-md bg-night-900/60 p-3">
        <SlotIconImg color={socket} size={20} />
        <span className="font-body text-base text-parchment-faint">
          {label} — empty
        </span>
        <button
          type="button"
          onClick={onFill}
          className="ml-auto rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
        >
          + Type one in
        </button>
      </div>
    );
  }

  return (
    <div className="frame rounded-md bg-night-900 p-3">
      <div className="flex items-start gap-2">
        <SlotIconImg color={shown} size={20} />
        <span className="font-body text-sm uppercase tracking-wide text-parchment-faint">{label}</span>
        {deep && (
          <span className="rounded border border-night-500 px-1 font-body text-sm uppercase tracking-wide text-gold-dim">
            Deep
          </span>
        )}
        <span className="ml-auto">
          <IconButton label={`Empty ${label}`} onClick={onClear} danger>
            <XIcon />
          </IconButton>
        </span>
      </div>

      {fixed ? (
        <div className="mt-2">
          <p className="font-body text-base text-parchment">{fixed.name}</p>
          <EffectLines lines={fixed.effects.map((text) => ({ text }))} size="sm" className="mt-1 space-y-0.5" />
          <button
            type="button"
            onClick={onUnfix}
            className="mt-2 font-body text-sm text-parchment-muted underline underline-offset-2 hover:text-gold-bright"
          >
            Not that relic — edit the lines instead
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Relic name (optional)"
            aria-label={`${label} relic name`}
            className="frame mt-2 w-full rounded bg-night-800 px-2 py-1 font-body text-base text-parchment placeholder:text-parchment-faint"
          />
          <ReviewLineInputs
            lines={draft.lines}
            demerits={draft.demerits}
            deep={deep}
            onLine={onLine}
            onDemerit={onDemerit}
            onSwap={onSwap}
          />
          {mismatch && (
            <p className="mt-1.5 font-body text-base text-gold-dim">
              Its icon read as {mismatch}, but this socket is {socket} — check the order.
            </p>
          )}
          {/* A White socket takes any relic, so it's the one place the color
              is the relic's own to state. Colored sockets have nothing to
              ask — the socket icon above already says what the relic is. */}
          {socket === "White" && (
            <label className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-body text-sm text-parchment-faint">
                Relic colour
              </span>
              <SlotIconImg color={shown} size={18} />
              <select
                value={shown}
                onChange={(e) => onColor(e.target.value as CustomRelic["color"])}
                aria-label={`Relic colour in ${label}`}
                className="frame rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment"
              >
                {RELIC_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="font-body text-sm text-parchment-faint">
                — this socket is White, so it takes any of them
              </span>
            </label>
          )}
          {draft.suggest && (
            <p className="mt-2 flex flex-wrap items-center gap-2 font-body text-base text-gold-dim">
              These are exactly <span className="text-parchment">{draft.suggest}</span>&rsquo;s
              effects — though every one of them can roll, so it may just be a roll that landed
              the same way.
              <button
                type="button"
                onClick={onUseSuggested}
                className="rounded border border-night-600 px-2 py-0.5 font-body text-base text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
              >
                Use {draft.suggest}
              </button>
            </p>
          )}
        </>
      )}

      <label className="mt-2 flex items-center gap-2">
        <span className="font-body text-sm text-parchment-faint">Move to</span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value !== "") onMove(Number(e.target.value));
          }}
          aria-label={`Move the relic in ${label}`}
          className="frame rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment"
        >
          <option value="">…</option>
          {others.map((o) => (
            <option key={o.index} value={o.index}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/**
 * After the save: the build exists, and what its relics did to the pool. The
 * near-misses are the point of the panel — two rolls a line apart are either
 * one relic the parser read twice or two relics that really are that close,
 * and only the player knows which.
 */
function SavedPanel({
  result,
  onOpen,
  onMerge,
  onKeepBoth,
  onAgain,
}: {
  result: SaveResult;
  onOpen: () => void;
  onMerge: (i: number) => void;
  onKeepBoth: (i: number) => void;
  onAgain: () => void;
}) {
  const open = result.near.filter((n) => !n.outcome).length;
  return (
    <div>
      <h4 className="font-display text-lg text-gold-bright">
        Saved — {result.buildName}
      </h4>
      <p className="mt-1 max-w-prose font-body text-base text-parchment-muted">
        {result.added.length > 0
          ? `${result.added.length} new relic${result.added.length === 1 ? "" : "s"} went into My Relics`
          : "No new relics were needed"}
        {result.reused > 0
          ? `, and ${result.reused} ${result.reused === 1 ? "was one you" : "were ones you"} already had.`
          : "."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md border border-gold-bright bg-gold px-5 py-2.5 font-display text-base font-semibold text-night-950 shadow-seal transition hover:bg-gold-bright"
        >
          Open the build
        </button>
        <button
          type="button"
          onClick={onAgain}
          className="frame rounded-md bg-night-800 px-4 py-2.5 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          Import another build
        </button>
      </div>

      {result.near.length > 0 && (
        <section className="mt-6">
          <h5 className="eyebrow mb-2 border-b border-night-700 pb-1.5 text-gold-dim">
            Possible repeats {open > 0 && <span className="font-body text-sm normal-case tracking-normal text-parchment-faint">{open} to check</span>}
          </h5>
          <p className="mb-3 max-w-prose font-body text-base text-parchment-muted">
            These read almost the same as relics already in your pool. If a line was misread,
            point the build at the one you had; if they really are two rolls, keep both.
          </p>
          <div className="space-y-2">
            {result.near.map((n, i) => (
              <div key={n.added.id} className="frame rounded-md bg-night-900 p-3">
                {n.outcome ? (
                  <p className="font-body text-base text-parchment-faint">
                    <span className="text-parchment">{n.added.name || `${n.added.color} relic`}</span>{" "}
                    {n.outcome === "merged"
                      ? "— the build now uses the relic you already had ✓"
                      : "— kept as its own relic ✓"}
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="font-body text-sm uppercase tracking-wide text-gold-dim">
                          Just imported
                        </p>
                        <p className="mt-0.5 font-body text-base text-parchment">
                          {n.added.name || `${n.added.color} relic`}
                        </p>
                        <EffectLines
                          lines={n.added.effects.map((text, k) => ({
                            text,
                            demerit: n.added.demerits?.[k]?.trim() || undefined,
                          }))}
                          size="sm"
                          className="mt-1 space-y-0.5"
                        />
                      </div>
                      <div>
                        <p className="font-body text-sm uppercase tracking-wide text-parchment-faint">
                          Already in your pool
                        </p>
                        <p className="mt-0.5 font-body text-base text-parchment">
                          {n.existing.name || `${n.existing.color} relic`}
                        </p>
                        <EffectLines
                          lines={n.existing.effects.map((text, k) => ({
                            text,
                            demerit: n.existing.demerits?.[k]?.trim() || undefined,
                          }))}
                          size="sm"
                          className="mt-1 space-y-0.5"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onMerge(i)}
                        className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-base text-gold-bright hover:bg-night-600"
                      >
                        Same relic — use the one I had
                      </button>
                      <button
                        type="button"
                        onClick={() => onKeepBoth(i)}
                        className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
                      >
                        Two different relics — keep both
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
