"use client";

// ── Custom relic editor (modal, with searchable effects + screenshot parse) ──

import { useEffect, useRef, useState } from "react";
import { newId, type CustomRelic } from "@/lib/builds";
import type { SlotColor } from "@/lib/chalices";
import {
  NORMAL_EFFECT_VOCABULARY,
  isCurseEffect,
  matchOcrLines,
  type EffectMatch,
} from "@/lib/effectMatch";
import {
  DEEP_CREATE_VOCABULARY,
  RELIC_COLORS,
  RelicLineInputs,
  SlotIconImg,
  ocrLines,
} from "./shared";

export function CustomRelicEditor({
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
  // also lists curses, which addEffect routes to a demerit line. Nothing is
  // listed until there's a search to narrow it: the whole pool is hundreds of
  // effects long, which buries the rest of the form rather than helping.
  const vocab = query
    ? (isDeep ? DEEP_CREATE_VOCABULARY : NORMAL_EFFECT_VOCABULARY).filter((e) =>
        e.toLowerCase().includes(query),
      )
    : [];
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
          {!query ? (
            <p className="mt-2 font-body text-xs text-parchment-faint">
              Type a few letters to find an effect — or fill the lines above, which suggest
              as you type.
            </p>
          ) : (
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
          )}

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
