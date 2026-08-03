// ─────────────────────────────────────────────────────────────────────────
//  Turn a Claude vision reply into the same parsed shape the OCR pipeline
//  produces. Claude transcribes and groups; the matching to the app's
//  vocabulary still runs through parseRelicGroups, so aliases, tier rescue,
//  character-tag rules and the unread-beats-wrong threshold behave
//  identically whichever reader produced the lines. Pure — shared by the
//  app client and the eval harness.
// ─────────────────────────────────────────────────────────────────────────

import { parseRelicGroups, screenIsDeep, type ParsedRelicGroup } from "./effectMatch";
import { colorFromRelicName, type RelicColor } from "./relicColor";
import type { VisionReply, VisionRelic } from "./visionPrompt";

export interface VisionRead {
  deep: boolean;
  /** One group per relic Claude reported that matched anything. */
  groups: ParsedRelicGroup[];
  /** colors[i] belongs to groups[i]. */
  colors: (RelicColor | null)[];
}

const COLORS = new Set(["Red", "Blue", "Green", "Yellow"]);

/** Loose runtime check — the reply crossed a network boundary. */
function coerceReply(raw: unknown): VisionReply {
  const r = raw as VisionReply | null;
  if (!r || typeof r !== "object" || !Array.isArray(r.relics)) {
    throw new Error("Unexpected vision reply shape");
  }
  return r;
}

/**
 * Each relic is matched on its own so Claude's per-relic color and grouping
 * survive: a relic whose lines all miss the vocabulary drops out together
 * with its color, and the ones around it keep their alignment.
 */
export function parseVisionReply(raw: unknown): VisionRead {
  const reply = coerceReply(raw);
  const groups: ParsedRelicGroup[] = [];
  const colors: (RelicColor | null)[] = [];
  for (const relic of reply.relics.slice(0, 6) as VisionRelic[]) {
    if (groups.length >= 6) break;
    const effects = (Array.isArray(relic?.effects) ? relic.effects : []).filter(
      (e): e is string => typeof e === "string" && e.trim().length > 0,
    );
    const lines: string[] = [];
    if (typeof relic?.name === "string" && relic.name.trim()) lines.push(relic.name.trim());
    effects.forEach((eff, i) => {
      lines.push(eff.trim());
      // A curse renders as the line under its effect — feed it back in that
      // order and the parser attaches it exactly as it does for OCR lines.
      const dem = relic.demerits?.[i];
      if (typeof dem === "string" && dem.trim()) lines.push(dem.trim());
    });
    if (lines.length === 0) continue;

    // A real relic has at most 3 effects. More means the model merged
    // neighbouring blocks into one "relic" (Haiku does this on vessel
    // panes) — salvage every line and let the parser's 3-effect cap split
    // them rather than discarding the overflow. The split boundaries are a
    // guess, so nothing per-relic (its reported color) can be trusted to
    // land on the right group; scene names still state theirs.
    if (effects.length > 3) {
      for (const g of parseRelicGroups(lines, 6 - groups.length)) {
        groups.push(g);
        colors.push(colorFromRelicName(g.name));
      }
      continue;
    }

    const group = parseRelicGroups(lines, 1)[0];
    if (!group) continue;
    groups.push(group);
    // Same precedence as the OCR path: a recognized scene name states its
    // color outright; Claude's read of the icon is the fallback.
    const seen = COLORS.has(relic.color as string) ? (relic.color as RelicColor) : null;
    colors.push(colorFromRelicName(group.name) ?? seen);
  }
  // Claude sees the whole screen (Deep of Night UI included), so its flag
  // counts even when no deep-only effect survived matching.
  const deep = reply.deep === true || screenIsDeep(groups);
  return { deep, groups, colors };
}
