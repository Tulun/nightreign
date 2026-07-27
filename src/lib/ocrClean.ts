// ─────────────────────────────────────────────────────────────────────────
//  OCR line cleanup shared by the screenshot importer and the eval harness.
// ─────────────────────────────────────────────────────────────────────────

import { screenTextScore } from "./effectMatch";

export interface OcrBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A recognized word with its box, as tesseract reports inside a line. */
export interface OcrWord {
  text: string;
  bbox: OcrBox | null;
}

/** A cleaned OCR line: text plus the box of the words it was kept from. */
export interface OcrLine {
  text: string;
  bbox: OcrBox | null;
}

/**
 * Rebuild a line from its words, keeping only the segment that holds the
 * real text. On full-screen captures the relic grid sits beside the effect
 * panel and tesseract merges both into one line ("…Art gauge +1 w= A NV Wy
 * be…" — the grid can sit on either side); the garbage is separated from
 * the text by a horizontal gap many times wider than any true space. Split
 * at such gaps, then keep the segment that best matches the game's
 * vocabulary — or, when nothing matches, the first substantial one. The
 * returned bbox covers only the kept words, so anything anchored to the
 * line (like icon color sampling) starts at the real text edge.
 */
export function lineFromWords(
  words: OcrWord[],
  fallback: { text: string; bbox: OcrBox | null },
): { text: string; bbox: OcrBox | null } {
  if (words.length === 0 || words.some((w) => !w.bbox)) {
    return { text: fallback.text.trim(), bbox: fallback.bbox };
  }
  const heights = words.map((w) => w.bbox!.y1 - w.bbox!.y0).sort((a, b) => a - b);
  const lineHeight = heights[heights.length >> 1] || 1;

  const segments: OcrWord[][] = [[words[0]]];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].bbox!.x0 - words[i - 1].bbox!.x1;
    if (gap > 2.5 * lineHeight) segments.push([]);
    segments[segments.length - 1].push(words[i]);
  }

  const candidates = segments
    .map((seg) => ({ seg, text: seg.map((w) => w.text).join(" ").trim() }))
    .filter((c) => c.text.length > 0);
  if (candidates.length === 0) return { text: fallback.text.trim(), bbox: fallback.bbox };

  let chosen = candidates[0];
  if (candidates.length > 1) {
    const scored = candidates
      .map((c) => ({ c, score: screenTextScore(c.text) }))
      .sort((a, b) => b.score - a.score);
    if (scored[0].score >= 0.5) {
      chosen = scored[0].c;
    } else {
      const substantial = (t: string) => (t.match(/[A-Za-z0-9]/g) ?? []).length >= 5;
      chosen = candidates.find((c) => substantial(c.text)) ?? candidates[0];
    }
  }
  return {
    text: chosen.text,
    bbox: {
      x0: Math.min(...chosen.seg.map((w) => w.bbox!.x0)),
      y0: Math.min(...chosen.seg.map((w) => w.bbox!.y0)),
      x1: Math.max(...chosen.seg.map((w) => w.bbox!.x1)),
      y1: Math.max(...chosen.seg.map((w) => w.bbox!.y1)),
    },
  };
}
