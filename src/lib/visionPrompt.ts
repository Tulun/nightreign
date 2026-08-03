// ─────────────────────────────────────────────────────────────────────────
//  The Claude vision reader's request: model, prompt, and reply schema.
//
//  This file must stay dependency-free — it is shared verbatim by three
//  callers: the app client (via visionRead.ts), the eval harness
//  (scripts/ocr-eval.ts --engine claude), and the Firebase Function proxy,
//  whose build copies this file into functions/src/. Keeping every caller on
//  one prompt is what makes the eval's numbers mean anything.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Haiku 4.5 — the cheapest vision-capable Claude, roughly half a cent per
 * screenshot at this prompt size. The reply is verbatim transcription, not
 * judgment, so the small model is enough; the matching to the app's
 * vocabulary happens in our code (visionRead.ts), same as the OCR path.
 */
export const VISION_MODEL = "claude-haiku-4-5";

export const VISION_MAX_TOKENS = 1500;

/**
 * Folded into the eval's cache key so cached replies from an older prompt or
 * model are not reused. Bump on any change to this file's prompt/schema.
 *
 * v2: measured against v1 (Haiku, 38 fixtures): grouping rules hardened
 * (v1 merged vessel-pane blocks into one relic), colors biased hard toward
 * null (v1 answered "Blue" from the blue UI — 28 wrong), preset/slot labels
 * excluded from names (v1 read a loadout label as a relic name).
 */
export const VISION_PROMPT_VERSION = "v2";

/** What the model is asked to return — mirrored by VISION_SCHEMA below. */
export interface VisionRelic {
  name: string | null;
  color: "Red" | "Blue" | "Green" | "Yellow" | null;
  effects: string[];
  /** demerits[i] is the curse under effects[i]; null where a line has none. */
  demerits: (string | null)[];
}

export interface VisionReply {
  deep: boolean;
  relics: VisionRelic[];
}

export const VISION_PROMPT = `You are reading a screenshot from the game Elden Ring: Nightreign — a relic screen (relic rites, a relic list, or a vessel's slot detail). Some captures are phone photos of a TV: tilted, dim, or blurry. Transcribe only what is actually legible.

The screen shows up to 6 relics, top to bottom. Each relic is a block of 1-3 effect lines, and the blocks are visually separated: a horizontal divider line and/or a clear vertical gap sits between one relic's lines and the next relic's. Vessel/slot panes (the ones with a row of relic icons across the top) list 3 relics this way, one block per equipped slot.

Grouping — get this right before anything else:
- A relic NEVER has more than 3 effects. If you are about to give one relic 4+ effects, you have merged neighbouring relics: go back and split at the divider lines / gaps between blocks.
- A bare "-" row is an empty effect slot; skip it, and note it also marks the end of that relic's block.
- Skip relics with no legible effect line, and skip all other screen text (headers, button hints, dates, counters, page labels).

Transcription:
- Transcribe every effect line EXACTLY as written, character for character, including tier suffixes like " +2" and leading character tags like "[Executor]". Never paraphrase or normalize wording.
- A light-blue line rendered directly under a white effect line is that effect's curse. Put it in "demerits" at the SAME index as its effect, with null at every index whose effect has no curse — "demerits" must have exactly as many entries as "effects". Never list a curse in "effects".

"name": the relic's display name ONLY when it is shown as a title heading that relic's own block (e.g. "Grand Burning Scene", "Deep Delicate Drizzly Scene", "Besmirched Frame"). Most layouts show no name — use null. Preset/loadout labels (e.g. a save name in the top-right), slot labels like "Slot 1", and character names are NOT relic names. Never invent one.

"color" — when in doubt, null. A wrong color is far worse than null:
- The color is the small colored diamond/gem attached to that relic's OWN icon: "Red", "Blue", "Green" or "Yellow".
- The game's UI is blue everywhere; blue backgrounds, panels, and glow are NOT a relic color.
- The small square icons at the left of each effect line are effect-category glyphs — never a relic color.
- On vessel/slot panes the icon row at the top cannot be reliably matched to the effect blocks below — use null for every relic there.
- Report a color only when you can see the specific relic's icon directly beside/above its own effect block and its gem color is unmistakable.

"deep": true when the screen shows Deep of Night relics — any light-blue curse line anywhere on screen, or relic names starting with "Deep" — else false. A screen is entirely one or the other.`;

/**
 * JSON schema for the structured-outputs API (output_config.format), so the
 * reply is guaranteed parseable — no fence-stripping, no retry-on-garbage.
 */
export const VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["deep", "relics"],
  properties: {
    deep: { type: "boolean" },
    relics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "color", "effects", "demerits"],
        properties: {
          name: { anyOf: [{ type: "string" }, { type: "null" }] },
          color: {
            anyOf: [
              { type: "string", enum: ["Red", "Blue", "Green", "Yellow"] },
              { type: "null" },
            ],
          },
          effects: { type: "array", items: { type: "string" } },
          demerits: {
            type: "array",
            items: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      },
    },
  },
} as const;
