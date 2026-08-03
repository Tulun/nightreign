// ─────────────────────────────────────────────────────────────────────────
//  OCR line cleanup shared by the screenshot importer and the eval harness.
// ─────────────────────────────────────────────────────────────────────────

import { retryCandidates, retryLineScore, screenTextScore } from "./effectMatch";

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

/**
 * Second-chance OCR for rows the full-page pass garbled. pickBestOcrPass
 * chooses whole passes, so a preprocessing variant that recovers one line but
 * wrecks others can never win — which left lines like the light-blue demerits
 * permanently unread. This sidesteps that: for each row that sits in the
 * effect column but matched nothing (retryCandidates), the host re-OCRs just
 * that strip in single-line mode across its preprocessing variants, and the
 * text replaces the row only when it clears the same match bar the parser
 * holds every line to (retryLineScore). Per-line acceptance bounds the
 * spurious risk — junk that can't pass the matcher can't enter the list —
 * and turns the max-channel variant from a global loser into a local winner
 * on exactly the blue lines it was built for.
 *
 * `readStrip` OCRs one rectangle of the screenshot and returns the text each
 * variant produced; it owns psm switching and coordinate clamping.
 */
export async function retryUnmatchedLines(
  lines: OcrLine[],
  readStrip: (rect: OcrBox) => Promise<string[]>,
): Promise<OcrLine[]> {
  const strips = retryCandidates(lines);
  if (strips.length === 0) return lines;
  const out = lines.slice();
  for (const s of strips) {
    const rect = { x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 };
    let best: { text: string; score: number } | null = null;
    for (const text of await readStrip(rect)) {
      const score = retryLineScore(text);
      if (score > 0 && (!best || score > best.score)) best = { text: text.trim(), score };
    }
    if (best) out[s.index] = { text: best.text, bbox: rect };
  }
  return out;
}
