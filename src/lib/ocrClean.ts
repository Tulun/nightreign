// ─────────────────────────────────────────────────────────────────────────
//  OCR line cleanup shared by the screenshot importer and the eval harness.
// ─────────────────────────────────────────────────────────────────────────

import { screenTextScore } from "./effectMatch";

/** A recognized word with its box, as tesseract reports inside a line. */
export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

/**
 * Rebuild a line's text from its words, keeping only the segment that holds
 * the real text. On full-screen captures the relic grid sits beside the
 * effect panel and tesseract merges both into one line ("…Art gauge +1 w= A
 * NV Wy be…" — the grid can sit on either side); the garbage is separated
 * from the text by a horizontal gap many times wider than any true space.
 * Split at such gaps, then keep the segment that best matches the game's
 * vocabulary — or, when nothing matches, the first substantial one.
 */
export function lineTextFromWords(words: OcrWord[], fallback: string): string {
  if (words.length === 0 || words.some((w) => !w.bbox)) return fallback.trim();
  const heights = words.map((w) => w.bbox!.y1 - w.bbox!.y0).sort((a, b) => a - b);
  const lineHeight = heights[heights.length >> 1] || 1;

  const segments: string[][] = [[words[0].text]];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].bbox!.x0 - words[i - 1].bbox!.x1;
    if (gap > 2.5 * lineHeight) segments.push([]);
    segments[segments.length - 1].push(words[i].text);
  }

  const texts = segments.map((s) => s.join(" ").trim()).filter(Boolean);
  if (texts.length > 1) {
    const scored = texts.map((t) => ({ t, score: screenTextScore(t) }));
    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score >= 0.5) return scored[0].t;
  }
  const substantial = (t: string) => (t.match(/[A-Za-z0-9]/g) ?? []).length >= 5;
  return texts.find(substantial) ?? texts[0] ?? fallback.trim();
}
