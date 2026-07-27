"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Pieces shared across the Builds feature: slot resolution, OCR helpers,
//  effect-line rendering/inputs, and the small icons and buttons the list
//  view, editor, and importers all use.
// ─────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import { characterChalices, grailChalices } from "@/data/chalices";
import { asset } from "@/lib/assets";
import { customRelicIcon, fixedRelics, type BuildSlot, type BuildStore, type CustomRelic } from "@/lib/builds";
import { SLOT_ICON, type Chalice, type SlotColor } from "@/lib/chalices";
import {
  CURSE_VOCABULARY,
  DEEP_EFFECT_VOCABULARY,
  NORMAL_EFFECT_VOCABULARY,
  pickBestOcrPass,
} from "@/lib/effectMatch";
import { grayInvertStretch } from "@/lib/imagePrep";
import { lineFromWords } from "@/lib/ocrClean";
import { dominantIconColor, iconSampleRegion } from "@/lib/relicColor";
import { gameEffectName } from "@/lib/relics";
import { EffectIcon } from "@/components/EffectIcon";

export const RELIC_COLORS: CustomRelic["color"][] = ["Red", "Blue", "Green", "Yellow"];

/** Everything clickable when creating a Deep relic: effects plus curses. */
export const DEEP_CREATE_VOCABULARY = [...DEEP_EFFECT_VOCABULARY, ...CURSE_VOCABULARY].sort();

/** The datalist id for an effect input of the given relic kind. */
export const effectListId = (deep: boolean) => (deep ? "effect-vocab-deep" : "effect-vocab-normal");

/**
 * Shared autocomplete lists for effect inputs — one per relic kind, so a
 * relic only ever suggests effects that can legally roll on it, plus the
 * curse list for demerit lines.
 */
export function EffectDatalists() {
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
export type SlotRef = { deep: boolean; index: number };

/** The chalices a character can equip: their own vessels plus the grails. */
export function chalicesFor(character: string): Chalice[] {
  const own = characterChalices.find((c) => c.name === character)?.chalices ?? [];
  return [...own, ...grailChalices];
}

export interface ResolvedLine {
  text: string;
  demerit?: string;
}

export function resolveSlot(
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
export function EffectLines({
  lines,
  className,
  size = "xs",
  divided = false,
  spread = false,
  pad = 0,
}: {
  lines: ResolvedLine[];
  className?: string;
  /** "base" for primary reading surfaces (relic cards); "sm" for build cards; "xs" for dense pickers. */
  size?: "xs" | "sm" | "base";
  /** Rule between lines, so each effect reads separately at a glance. */
  divided?: boolean;
  /**
   * Hold every line to the pitch of an effect *with* a demerit under it,
   * desktop only. Used where two slot lists sit side by side: a Deep of Night
   * relic carries a demerit under most effects, so its lines run at roughly
   * double pitch and a plain list beside it reads as a different rhythm.
   * Matching the pitch lines the two columns up effect-for-effect. Narrow
   * screens show one list at a time, where compact beats aligned.
   */
  spread?: boolean;
  /**
   * Pad the list out to this many rows with an icon-sized blank and a dash,
   * the way the game shows an effect slot a relic hasn't filled. Desktop
   * only, and decorative — it's what makes two slot blocks the same height
   * even when one relic carries fewer effects than its neighbour.
   */
  pad?: number;
}) {
  const sizeClass =
    size === "base" ? "text-base leading-relaxed" : size === "sm" ? "text-sm leading-relaxed" : "text-xs leading-snug";
  // The glyph tracks the text size, and the row is a flex pair so a wrapped
  // effect indents under its own first line instead of running back under the
  // icon — which is what separates crowded lines on a phone.
  const iconSize = size === "base" ? 18 : size === "sm" ? 15 : 13;
  return (
    <ul className={`${divided ? "divide-y divide-night-700" : ""} ${className ?? ""}`}>
      {lines.map((l, i) => (
        <li
          key={`${l.text}-${i}`}
          className={`font-body text-parchment-muted ${sizeClass} ${divided ? "py-1.5 first:pt-0 last:pb-0" : ""} ${
            // Two text-sm/leading-relaxed lines plus the demerit's own gap.
            spread ? "sm:min-h-[3rem]" : ""
          }`}
        >
          <span className="flex items-start gap-1.5">
            <EffectIcon name={l.text} size={iconSize} />
            <span className="min-w-0">{gameEffectName(l.text)}</span>
          </span>
          {/* A demerit carries no glyph — the red text already reads as the
              cost, and a second icon competes with the effect it belongs to.
              It indents to the effect's text column instead. */}
          {l.demerit && (
            <span
              className="mt-0.5 block text-red-300/80"
              style={{ paddingLeft: iconSize + 6 }}
            >
              {gameEffectName(l.demerit)}
            </span>
          )}
        </li>
      ))}
      {/* Unfilled effect slots: the icon's footprint and a dash, as the game
          shows them. Hidden on mobile, where one slot set shows at a time and
          there is nothing to line up with. */}
      {Array.from({ length: Math.max(0, pad - lines.length) }).map((_, i) => (
        <li
          key={`pad-${i}`}
          aria-hidden="true"
          className={`hidden font-body text-parchment-faint sm:list-item ${sizeClass} ${
            spread ? "sm:min-h-[3rem]" : ""
          }`}
        >
          <span className="flex items-start gap-1.5">
            <span
              className="mt-[0.15em] shrink-0 rounded-sm border border-night-600/70"
              style={{ width: iconSize, height: iconSize }}
            />
            <span>—</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Compact square icon button (edit / delete on dense cards). */
export function IconButton({
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

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export { colorFromRelicName } from "@/lib/relicColor";

export interface OcrLine {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

/** The file drawn to a canvas with its pixels run through grayInvertStretch. */
async function preprocessedCopy(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0);
    const pixels = ctx.getImageData(0, 0, bmp.width, bmp.height);
    const prepped = grayInvertStretch({ width: bmp.width, height: bmp.height, data: pixels.data });
    pixels.data.set(prepped.data);
    ctx.putImageData(pixels, 0, 0);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  } catch {
    return null;
  }
}

/** Run OCR on an image and return its text lines (with positions when available). */
export async function ocrLines(file: File, onProgress: (status: string) => void): Promise<OcrLine[]> {
  onProgress("Loading OCR engine (downloads a few MB on first use)…");
  const { createWorker } = await import("tesseract.js");
  let pass = 1;
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(`Reading screenshot (pass ${pass}/2)… ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  const extract = (data: Awaited<ReturnType<typeof worker.recognize>>["data"]): OcrLine[] => {
    const lines: OcrLine[] = (data.blocks ?? []).flatMap((b) =>
      (b.paragraphs ?? []).flatMap((p) =>
        (p.lines ?? []).map((l) =>
          lineFromWords(l.words ?? [], { text: l.text ?? "", bbox: l.bbox ?? null }),
        ),
      ),
    );
    if (lines.length > 0) return lines;
    return data.text.split("\n").map((text) => ({ text, bbox: null }));
  };
  try {
    const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
    const pass1 = extract(data);
    // Second pass on a contrast-boosted copy — it recovers lines the
    // original misses on some captures and wrecks others, so the passes
    // compete on parse quality and the better one wins per image.
    pass = 2;
    const prepped = await preprocessedCopy(file);
    if (!prepped) return pass1;
    const { data: data2 } = await worker.recognize(prepped, {}, { text: true, blocks: true });
    return pickBestOcrPass([pass1, extract(data2)]);
  } finally {
    await worker.terminate();
  }
}

/**
 * Guess each parsed relic's color by sampling the image left of its first
 * effect line, where the relic icon glows in the relic's color. Best effort —
 * returns null wherever the icon region can't be located or read.
 */
export async function guessGroupColors(
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
      const region = iconSampleRegion(g.bbox, bmp.height);
      if (!region) return null;
      const pixels = ctx.getImageData(region.x0, region.y0, region.width, region.height).data;
      return dominantIconColor(pixels);
    });
  } catch {
    return groups.map(() => null);
  }
}

export function SlotIconImg({ color, size = 20 }: { color: SlotColor; size?: number }) {
  return (
    <Image src={asset(SLOT_ICON[color])} alt={color} title={color} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
  );
}

/** A relic's picture (unique-relic art or a scene image for custom relics). */
export function RelicImg({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
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
export function RelicLineInputs({
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
