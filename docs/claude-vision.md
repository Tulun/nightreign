# Claude vision reader — benchmarked, shelved 2026-08-03

An experiment in replacing/augmenting the screenshot importer's tesseract
pipeline with Claude vision (Haiku 4.5 behind a Firebase Function proxy).
**It lost to OCR on the 38-screenshot eval and was unwired from the app.**
The importer is OCR-only again (`ImportRelics.tsx` / `shared.tsx` are back to
their pre-experiment state); the deployed function was deleted and the
`ANTHROPIC_API_KEY` secret destroyed, so nothing can spend API money.

## The numbers (38 fixtures, `npm run ocr:eval`)

| Engine | Effects | Spurious | Colors | Deep flag |
| --- | --- | --- | --- | --- |
| **tesseract (shipped)** | **94%** | 15 | **9✓ / 55– / 0✗** | **40/40** |
| Haiku 4.5, prompt v1 + salvage | 90% | 21 | 16✓ / 20– / 28✗ | 37/38 |
| Haiku 4.5, prompt v2 | 77% | 57 | 10✓ / 45– / 9✗ | 28/38 |
| Sonnet 4.6, prompt v2 | 67% | 92 | 10✓ / 54– / 0✗ | 37/38 |

Failure modes that decided it: models merge vessel-pane relic blocks into
one relic (v1) or over-split when told not to (v2 — the grouping instruction
*added* spurious effects); colors get guessed from the blue UI or icon art
(a wrong color silently corrupts an import — worse than unread); Sonnet was
no better than Haiku here. The one clear win was demerits (98–100%), which
OCR already handles at 99%.

## What still exists (all zero-cost)

- `src/lib/visionPrompt.ts` / `src/lib/visionRead.ts` — the prompt/schema and
  the reply→relics parser (incl. the merged-block salvage). Pure, unused by
  the app.
- `scripts/ocr-eval.ts --engine claude` — the eval engine, with
  `VISION_MODEL=<id>` for A/B runs and replies cached in
  `ocr-eval/.cache/vision/` (the paid replies from these runs are still
  there; re-scoring them is free).
- `functions/` — the proxy source, compiles but **not deployed**.

## Resuming the experiment later

1. Iterate on the prompt/model via the eval only (`export ANTHROPIC_API_KEY`
   locally); each fresh prompt version costs ~20¢/model to measure. Bump
   `VISION_PROMPT_VERSION` per change. The bar: beat 94% effects with zero
   wrong colors.
2. Only if it wins: re-set the secret, `npm run functions:deploy`, and re-wire
   the importer. The client wiring was removed before ever being committed,
   so it must be re-written — it's small, since `visionRead.ts` does the
   heavy lifting: downscale the file to ≤1568px JPEG base64, call the
   `parseRelicScreenshot` callable, feed `parseVisionReply` the reply, and
   wrap the whole thing in a try/catch that falls back to `readScreenshot`.
