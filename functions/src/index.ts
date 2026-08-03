// ─────────────────────────────────────────────────────────────────────────
//  Claude vision proxy for the screenshot importer. The static site can't
//  hold an API key, so this callable owns it: it accepts one screenshot,
//  forwards it to Claude with the pinned prompt/schema (nothing else — this
//  is not a general proxy), and returns the structured reply for the client
//  to match against the app's vocabulary.
//
//  Deploying needs two one-time steps (see docs/claude-vision.md):
//    npx --yes firebase-tools functions:secrets:set ANTHROPIC_API_KEY
//    npm run functions:deploy        (from the repo root; Blaze plan required)
// ─────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { VISION_MAX_TOKENS, VISION_MODEL, VISION_PROMPT, VISION_SCHEMA } from "./visionPrompt";

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

/** The client downscales to ≤1568px JPEG first; 8 MB of base64 is ample. */
const MAX_IMAGE_BASE64_CHARS = 8 * 1024 * 1024;

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"] as const);
type MediaType = typeof MEDIA_TYPES extends Set<infer T> ? T : never;

export const parseRelicScreenshot = onCall(
  {
    region: "us-central1",
    secrets: [anthropicKey],
    memory: "256MiB",
    timeoutSeconds: 60,
    // One user importing a batch reads screenshots one at a time; a spike
    // beyond this is abuse, not traffic — cap the spend.
    maxInstances: 5,
  },
  async (request) => {
    // Reading costs real API money, so only signed-in users get to spend it.
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to use the Claude reader.");
    }
    const { imageBase64, mediaType } = (request.data ?? {}) as {
      imageBase64?: unknown;
      mediaType?: unknown;
    };
    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      throw new HttpsError("invalid-argument", "imageBase64 must be a non-empty string.");
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
      throw new HttpsError("invalid-argument", "Screenshot too large — downscale before sending.");
    }
    if (typeof mediaType !== "string" || !MEDIA_TYPES.has(mediaType as MediaType)) {
      throw new HttpsError("invalid-argument", "mediaType must be image/jpeg, image/png or image/webp.");
    }

    const client = new Anthropic({ apiKey: anthropicKey.value() });
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: VISION_MODEL,
        max_tokens: VISION_MAX_TOKENS,
        output_config: {
          format: { type: "json_schema", schema: VISION_SCHEMA as unknown as Record<string, unknown> },
        },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType as MediaType,
                  data: imageBase64,
                },
              },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError) {
        throw new HttpsError("unavailable", "The Claude reader is busy — try again in a moment.");
      }
      console.error("Anthropic request failed", e);
      throw new HttpsError("internal", "The Claude reader failed on this screenshot.");
    }

    if (response.stop_reason === "refusal") {
      throw new HttpsError("failed-precondition", "The Claude reader declined this image.");
    }
    const text = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    )?.text;
    if (!text) {
      throw new HttpsError("internal", "The Claude reader returned no text.");
    }
    let reply: unknown;
    try {
      reply = JSON.parse(text);
    } catch {
      throw new HttpsError("internal", "The Claude reader returned unparseable output.");
    }
    return { reply };
  },
);
