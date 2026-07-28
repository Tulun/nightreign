# OCR eval harness

Measures how well the screenshot importer (OCR → effect matching → relic
grouping → icon color sampling) reads real game screenshots, by running the
exact same pipeline the app uses against screenshots whose correct output has
been verified by a human. Any change to the pipeline — preprocessing,
tesseract settings, fuzzy-match thresholds in `src/lib/effectMatch.ts` — can
then be judged by whether these numbers go up or down.

## Running it

```bash
npm run ocr:eval
```

The first run downloads tesseract's English model (~11 MB) into
`ocr-eval/.cache/` and OCRs every screenshot — two passes each (the original
and a contrast-boosted copy compete on parse quality), so expect several
seconds per image. OCR results are cached by image content, so later runs are
near-instant — perfect for tuning the matching side of the pipeline.

Options (note the `--` that separates npm's args from the script's):

```bash
npm run ocr:eval -- --verbose          # also print raw OCR lines per image
npm run ocr:eval -- --filter deep      # only fixtures whose filename contains "deep"
npm run ocr:eval -- --no-cache        # force re-OCR (after changing OCR settings)
npm run ocr:eval -- --dump-colors     # write each color-sample crop to .cache/colors/
```

`--dump-colors` also logs the sampled region's coordinates per relic — when a
color is wrong or unread, look at the dumped crop first; it shows exactly what
the classifier saw.

If you change anything about how OCR itself runs (engine options,
preprocessing), bump `OCR_CONFIG_KEY` in `scripts/ocr-eval.ts` so stale cached
results aren't reused.

## Adding a fixture

A fixture is a screenshot plus a JSON file with the same base name, both in
`ocr-eval/fixtures/`:

```
ocr-eval/fixtures/
  relic-rites-01.png     ← the screenshot
  relic-rites-01.json    ← what a perfect parse would produce
```

A fixture can also be **pre-supplied OCR lines** instead of a screenshot:
`<name>.lines.json` holding the line array (`[{ "text": …, "bbox": { x0, y0,
x1, y1 } | null }, …]`) next to the usual `<name>.json` expectations. These
skip OCR and color sampling and pin down grouping/matching behavior directly —
useful when the screenshot that exposed a bug isn't available to commit (see
`vessel-blank-slot.lines.json`, which pins the blank-third-slot grouping fix).
Prefer a real screenshot when you have one: it exercises the whole pipeline.

### 1. Capture the screenshot

- Screenshot the **relic rites / relic list screen** where each relic's name
  appears with its effect lines underneath, or a close-up of a single relic's
  effects. PNG or JPEG, any resolution — use the same kind of capture you'd
  actually feed the importer (Steam screenshot, phone photo of the TV, etc.).
  A mix of clean captures and awkward ones makes the eval honest.
- Up to 6 relics per screenshot are parsed (the importer's cap).

### 2. Write the expected JSON

List the relics **in screenshot order, top to bottom** — scoring aligns the
parser's output to yours by position. Every string must be an **exact** entry
from the app's vocabulary (the same names the relic-creation dropdowns offer)
**or the exact in-game phrasing** where the two differ — the game writes
"Reduced Strength and Intelligence" and "[Duchess] …" where the catalogue
writes "Reduced Strength & Intelligence" and "Duchess: …"; those known
phrasings (the alias table in `src/lib/effectMatch.ts`) are accepted and
resolved to their catalogue entry. Anything else is rejected with a "did you
mean …?" suggestion, so typos can't silently skew the scores. Transcribe what
the screenshot says — if a real in-game line is rejected, that's a missing
alias worth adding, not a fixture problem.

```json
{
  "deep": false,
  "relics": [
    {
      "name": "Polished Burning Scene",
      "color": "Red",
      "effects": [
        "Improved Straight Sword Attack Power",
        "Fire Attack Power Up +1"
      ]
    },
    {
      "name": "Delicate Tranquil Scene",
      "color": "Green",
      "effects": ["Critical Hit Boosts Stamina Recovery Speed"]
    }
  ]
}
```

A **Deep relic** screenshot adds two things: `"deep": true` at the top level,
and a `demerits` array per relic where entry *i* is the curse attached to
effect *i* (`null` for lines without one — in game, a curse renders as the
red line directly under its effect):

```json
{
  "deep": true,
  "relics": [
    {
      "name": "Deep Grand Burning Scene",
      "color": "Red",
      "effects": [
        "Fire Attack Power Up +3",
        "Increased Maximum HP",
        "Improved Affinity Attack Power +2"
      ],
      "demerits": [null, "Reduced Vigor & Arcane", null]
    },
    {
      "name": "Deep Delicate Drizzly Scene",
      "color": "Blue",
      "effects": ["Physical Attack Up +4"],
      "demerits": ["Reduced Strength & Faith"]
    }
  ]
}
```

Here the first relic's only curse sits under its *second* effect line, so it
lands in the middle demerit slot with `null` on both sides. Note the tier
suffixes (`+3`, `+4`) and the deep scene names (`Deep <size> <scene> Scene`)
— both must match the vocabulary exactly, and remember Drizzly=Blue.

Field notes:

- `deep` — `true` when the screenshot shows Deep of Night relics (a
  screenshot shows either normal or Deep relics, never both). Omit for
  normal relics.
- `name` — the relic's display name, e.g. `"Grand Drizzly Scene"`,
  `"Deep Delicate Luminous Scene"`, or a unique relic like `"Besmirched Frame"`.
  Use `null` if the name is cropped out of the shot.
- `color` — `"Red" | "Blue" | "Green" | "Yellow"`, as shown in game. Omit to
  leave the color unscored for that relic (e.g. the icon is cropped out).
  Remember the in-game scene↔color pairing: Burning=Red, **Drizzly=Blue,
  Tranquil=Green**, Luminous=Yellow.
- `effects` — 1–3 effect lines, top to bottom, exact vocabulary names
  including any tier suffix (`"Fire Attack Power Up +2"`).
- `demerits` — Deep relics only: `demerits[i]` is the curse attached to
  `effects[i]`, `null` where a line has none, e.g.
  `"demerits": [null, "Reduced Rune Acquisition"]`. Omit entirely when the
  relic has no demerits.
- `notes` — optional free text (capture conditions, known quirks); ignored by
  the harness.

### 3. Run and read the output

Per fixture you get a one-line summary plus a diff for anything wrong:

```
── relic-rites-01.png ──────────────────────────────
  relics 2/2 · names 2/2 · effects 2/3 (+1 spurious) · colors 2✓ 0– 0✗ · deep ✓
  relic 1 (Polished Burning Scene):
    missed   Fire Attack Power Up +1
    spurious Fire Attack Power Up +2
```

- **effects** — verified lines the parser recovered; `spurious` are lines it
  invented (a missed+spurious pair is usually one line snapped to the wrong
  vocabulary entry, often a tier mix-up).
- **colors** — `✓` right, `–` couldn't read (parser returned null), `✗` wrong.
- **deep** — whether the Deep-relic detection agreed with the fixture.

The TOTALS block at the end is the number to watch when tuning: overall
effect recall, spurious count, name/demerit/color accuracy.

## What lives where

- `ocr-eval/fixtures/` — screenshots + expected JSON. **Committed to git**
  (nothing in `ocr-eval/` ships with the app; the site only bundles `src/`
  and `public/`); they are the eval set, and it only gets more trustworthy as
  it grows. When the importer misreads a screenshot in real use, that
  screenshot (with its corrected output) is a perfect new fixture.
- `ocr-eval/.cache/` — tesseract language data + cached OCR output.
  Gitignored; safe to delete anytime.
- `scripts/ocr-eval.ts` — the harness. It imports the production matching
  code (`src/lib/effectMatch.ts`, `src/lib/relicColor.ts`) rather than
  copying it, so what it measures is what the app ships.
