// ─────────────────────────────────────────────────────────────────────────
//  OCR line cleanup shared by the screenshot importer and the eval harness.
// ─────────────────────────────────────────────────────────────────────────

import { despacedKey, matchedEffectEntry, retryCandidates, retryLineScore, screenTextScore } from "./effectMatch";

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
  const inserts: OcrLine[] = [];
  for (const s of strips) {
    const rect = { x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 };
    // A junk row's box can be inflated by the very glare that garbled it, and
    // psm-7 gives up entirely on a strip that drags in part of the next row
    // or a bright streak past the text (lp-3's "Improved Damage Negation…"
    // row read empty at full size but cleanly at ~⅔ the width and ¾ the
    // height). When the full strip fails the bar, one tighter crop — same
    // left edge, trimmed right and vertical margins — gets a second shot.
    const cy = (s.y0 + s.y1) / 2;
    const tight = {
      x0: s.x0,
      y0: cy - 0.375 * (s.y1 - s.y0),
      x1: s.x0 + 0.65 * (s.x1 - s.x0),
      y1: cy + 0.375 * (s.y1 - s.y0),
    };
    // An anchored strip re-reads a row that visibly exists, so any text
    // clearing the parser's bar beats the junk it replaces. A synthesized
    // strip is a guess at a row nothing attests to — scanning header chrome
    // and name rows, where weak 0.5-bar hits on short entries are routine
    // ("Arcane +2" off a close-up's name row) and an accepted one becomes a
    // phantom row that splits relics. Real glare recoveries of erased rows
    // read nearly clean (0.9+), so pure speculation pays only for confident
    // text.
    const floor = s.index >= 0 ? 0 : 0.8;
    let best: { text: string; score: number } | null = null;
    for (const r of [rect, tight]) {
      for (const text of await readStrip(r)) {
        const score = retryLineScore(text);
        if (score > floor && (!best || score > best.score)) best = { text: text.trim(), score };
      }
      if (best) break;
    }
    if (!best) continue;
    // A strip that clips a neighboring row reads that row minus some words —
    // and a fragment like "…ion at start of expedition" then containment-
    // matches some OTHER entry sharing the tail ("Small Pouch in possession
    // …" grew a phantom relic on nightman-3 exactly this way). A read whose
    // text is a piece of a row already in the list — or of that row's
    // matched entry, since the row's own text may be garbled or truncated —
    // is a partial re-read, not a new row. Near-verbatim reads (≥0.97) are
    // exempt: a complete line stands on its own even when a longer sibling
    // contains it (a short demerit under a compound stat line). Anchored
    // strips only check nearby rows, so a real repeated effect elsewhere on
    // screen can still be recovered; speculative strips check them all.
    if (best.score < 0.97) {
      const key = despacedKey(best.text);
      const cy = (rect.y0 + rect.y1) / 2;
      const reach = 2.5 * (rect.y1 - rect.y0);
      const echo = out.some((l, i) => {
        if (i === s.index || l.text.trim().length < 8) return false;
        if (!s.speculative) {
          if (!l.bbox) return false;
          if (Math.abs((l.bbox.y0 + l.bbox.y1) / 2 - cy) > reach) return false;
        }
        if (despacedKey(l.text).includes(key)) return true;
        const entry = matchedEffectEntry(l.text);
        return entry != null && despacedKey(entry).includes(key);
      });
      if (echo) continue;
    }
    if (s.index >= 0) out[s.index] = { text: best.text, bbox: rect };
    else inserts.push({ text: best.text, bbox: rect });
  }
  // Synthesized strips carry no source line to replace — splice each into
  // the list at its y position, since group parsing reads lines in order.
  for (const line of inserts) {
    const at = out.findIndex((l) => l.bbox && l.bbox.y0 > line.bbox!.y0);
    if (at === -1) out.push(line);
    else out.splice(at, 0, line);
  }
  return out;
}
