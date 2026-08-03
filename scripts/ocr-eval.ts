// ─────────────────────────────────────────────────────────────────────────
//  OCR eval harness: runs the screenshot-import pipeline (tesseract OCR →
//  effect matching → relic grouping → icon color sampling) against fixture
//  screenshots with verified expected output, and scores the results.
//
//  Usage:  npm run ocr:eval [-- --verbose] [-- --no-cache] [-- --filter <s>]
//                           [-- --engine claude] [-- --sweep]
//  --sweep grids over the parseRelicGroups geometry thresholds instead of
//  scoring once — matching-side only, so it runs entirely off cached OCR.
//  --engine claude scores the Claude vision reader (the same request the
//  parseRelicScreenshot Firebase Function makes, called directly with your
//  Anthropic credentials) instead of tesseract. Fixtures live in
//  ocr-eval/fixtures/ — see ocr-eval/README.md.
// ─────────────────────────────────────────────────────────────────────────

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import {
  CURSE_VOCABULARY,
  EFFECT_VOCABULARY,
  RELIC_NAME_VOCABULARY,
  parseRelicGroups,
  pickBestOcrPass,
  resolveEffectAlias,
  screenIsDeep,
  similarity,
} from "@/lib/effectMatch";
import { grayInvertStretch, maxChannelInvertStretch } from "@/lib/imagePrep";
import { lineFromWords } from "@/lib/ocrClean";
import {
  colorFromRelicName,
  dominantIconColor,
  iconSampleRegion,
  type IconBox,
  type RelicColor,
} from "@/lib/relicColor";
import {
  VISION_MAX_TOKENS,
  VISION_MODEL,
  VISION_PROMPT,
  VISION_PROMPT_VERSION,
  VISION_SCHEMA,
} from "@/lib/visionPrompt";
import { parseVisionReply } from "@/lib/visionRead";

const ROOT = path.join(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "ocr-eval", "fixtures");
const CACHE_DIR = path.join(ROOT, "ocr-eval", ".cache");

// Bump when OCR settings change (engine params, preprocessing, tesseract
// version) so cached OCR results from the old settings are not reused.
//
// OCR_EXP holds comma-separated experiment flags, folded into the cache key
// so each configuration caches separately:
//   psm=<n>    set tessedit_pageseg_mode (default AUTO=3)
//   whitelist  restrict tessedit_char_whitelist to game-text characters
//   maxchan    add a third pass: max-channel grayscale (targets blue demerits)
const OCR_EXP = (process.env.OCR_EXP ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const OCR_CONFIG_KEY = ["tesseract7-eng-v6-best-pass", ...OCR_EXP].join("+");

// ── Expected-output fixture format ───────────────────────────────────────

const COLORS: RelicColor[] = ["Red", "Blue", "Green", "Yellow"];

interface ExpectedRelic {
  /** Relic display name, or null if the name is cropped out of the shot. */
  name: string | null;
  /** Omit (or null) to leave the color unscored for this relic. */
  color?: RelicColor | null;
  effects: string[];
  /** demerits[i] belongs to effects[i]; omit when the relic has none. */
  demerits?: (string | null)[];
  notes?: string;
}

interface Fixture {
  /** True when the screenshot shows Deep relics. */
  deep?: boolean;
  /** Relics in screenshot order, top to bottom. */
  relics: ExpectedRelic[];
  notes?: string;
}

/**
 * Reject fixture typos, canonicalizing as it goes: every expected line must
 * be a vocab entry or a known in-game alias phrasing (case-insensitive
 * either way); accepted lines are rewritten to their canonical entry so
 * scoring compares canonical names.
 */
function validateFixture(fx: Fixture, file: string): string[] {
  const errors: string[] = [];
  const lower = (vocab: string[]) => new Map(vocab.map((v) => [v.toLowerCase(), v]));
  const lowerVocabs = {
    effects: lower(EFFECT_VOCABULARY),
    curses: lower(CURSE_VOCABULARY),
    names: lower(RELIC_NAME_VOCABULARY),
  };
  const check = (value: string, kind: keyof typeof lowerVocabs, what: string): string | null => {
    const resolved = resolveEffectAlias(value);
    const canonical = lowerVocabs[kind].get(resolved.toLowerCase());
    if (canonical) return canonical;
    const vocab = Array.from(lowerVocabs[kind].values());
    const nearest = vocab
      .map((v) => ({ v, s: similarity(value, v) }))
      .sort((a, b) => b.s - a.s)[0];
    errors.push(
      `${file}: ${what} "${value}" is not an exact vocabulary entry` +
        (nearest && nearest.s > 0.6 ? ` — did you mean "${nearest.v}"?` : ""),
    );
    return null;
  };
  if (!Array.isArray(fx.relics)) return [`${file}: missing "relics" array`];
  fx.relics.forEach((r, i) => {
    if (r.name != null) {
      r.name = check(r.name, "names", `relic ${i + 1} name`) ?? r.name;
    }
    if (r.color != null && !COLORS.includes(r.color)) {
      errors.push(`${file}: relic ${i + 1} color "${r.color}" must be one of ${COLORS.join("/")}`);
    }
    r.effects = (r.effects ?? []).map((e) => check(e, "effects", `relic ${i + 1} effect`) ?? e);
    if (r.demerits) {
      r.demerits = r.demerits.map((d) =>
        d == null || d === "" ? d : check(d, "curses", `relic ${i + 1} demerit`) ?? d,
      );
    }
  });
  return errors;
}

// ── OCR (mirrors ocrLines in src/components/builds/shared.tsx) ───────────

interface OcrLine {
  text: string;
  bbox: IconBox | null;
}

type Worker = import("tesseract.js").Worker;

async function ocrLines(worker: Worker, imagePath: string): Promise<OcrLine[]> {
  const extract = (data: Awaited<ReturnType<Worker["recognize"]>>["data"]): OcrLine[] => {
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
  const { data } = await worker.recognize(imagePath, {}, { text: true, blocks: true });
  const pass1 = extract(data);
  // Second pass on a contrast-boosted copy — it recovers lines the original
  // misses on some captures and wrecks others, so the two passes compete on
  // parse quality and the better one wins per image.
  const img = decodeImage(imagePath);
  if (!img) return pass1;
  const passes = [pass1];
  const preps = [grayInvertStretch];
  if (OCR_EXP.includes("maxchan")) preps.push(maxChannelInvertStretch);
  for (const prep of preps) {
    const prepped = prep(img);
    const png = new PNG({ width: prepped.width, height: prepped.height });
    png.data = Buffer.from(prepped.data);
    const { data: d } = await worker.recognize(PNG.sync.write(png), {}, { text: true, blocks: true });
    passes.push(extract(d));
  }
  return pickBestOcrPass(passes);
}

// ── Claude vision engine ─────────────────────────────────────────────────
// The exact request the parseRelicScreenshot Firebase Function makes (same
// model, prompt, and schema — all from src/lib/visionPrompt.ts), made
// directly with local Anthropic credentials (ANTHROPIC_API_KEY, or an
// `ant auth login` profile). Replies are cached by prompt version + image
// bytes, like OCR results.

type AnthropicClient = InstanceType<typeof import("@anthropic-ai/sdk").default>;
let anthropic: AnthropicClient | null = null;

// Eval-only model override for A/B runs (the app and function stay pinned to
// visionPrompt.ts): VISION_MODEL=claude-sonnet-4-6 npm run ocr:eval -- --engine claude
// Each model caches under its own key, so switching back re-costs nothing.
const visionModel = process.env.VISION_MODEL || VISION_MODEL;

async function visionReply(imagePath: string, bytes: Buffer): Promise<unknown> {
  if (!anthropic) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropic = new Anthropic();
  }
  const mediaType = bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg";
  let response: Awaited<ReturnType<AnthropicClient["messages"]["create"]>>;
  try {
    response = await anthropic.messages.create({
      model: visionModel,
      max_tokens: VISION_MAX_TOKENS,
      output_config: {
        format: { type: "json_schema", schema: VISION_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: bytes.toString("base64") } },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
    });
  } catch (e) {
    // The SDK resolves credentials at request time; surface the fix, not a
    // stack trace, when there are none.
    if (e instanceof Error && /api ?key|auth(entication)? (token|method)/i.test(e.message)) {
      throw new Error(
        "The claude engine needs Anthropic credentials — export ANTHROPIC_API_KEY (or sign in with `ant auth login`) and re-run.",
      );
    }
    throw e;
  }
  if (response.stop_reason === "refusal") {
    throw new Error(`${path.basename(imagePath)}: Claude declined this image`);
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error(`${path.basename(imagePath)}: no text in Claude reply`);
  return JSON.parse(text);
}

// Kept apart from the tesseract cache: everything else under .cache/ costs
// only CPU to rebuild, but these replies cost API money — clearing the OCR
// cache shouldn't silently re-spend it.
const VISION_CACHE_DIR = path.join(CACHE_DIR, "vision");

async function cachedVisionReply(imagePath: string, useCache: boolean): Promise<unknown> {
  const bytes = readFileSync(imagePath);
  const key = createHash("sha1")
    .update(`vision-${visionModel}-${VISION_PROMPT_VERSION}`)
    .update(bytes)
    .digest("hex");
  const cacheFile = path.join(VISION_CACHE_DIR, `${key}.json`);
  if (useCache && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, "utf8"));
  }
  const reply = await visionReply(imagePath, bytes);
  mkdirSync(VISION_CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(reply));
  return reply;
}

/** OCR with a disk cache — tuning the matcher shouldn't re-OCR every run. */
async function cachedOcrLines(
  getWorker: () => Promise<Worker>,
  imagePath: string,
  useCache: boolean,
): Promise<OcrLine[]> {
  const bytes = readFileSync(imagePath);
  const key = createHash("sha1").update(OCR_CONFIG_KEY).update(bytes).digest("hex");
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  if (useCache && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, "utf8")) as OcrLine[];
  }
  const lines = await ocrLines(await getWorker(), imagePath);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(lines));
  return lines;
}

// ── Image decoding for icon color sampling ───────────────────────────────

interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

function decodeImage(imagePath: string): RgbaImage | null {
  const buf = readFileSync(imagePath);
  try {
    // Sniff the real format — a fixture can wear the wrong extension.
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      // Some tools append metadata after IEND, which pngjs rejects — cut there.
      const iend = buf.indexOf("IEND");
      const png = PNG.sync.read(iend >= 0 ? buf.subarray(0, iend + 8) : buf);
      return { width: png.width, height: png.height, data: png.data };
    }
    return jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 2048 });
  } catch {
    return null;
  }
}

function cropRgba(img: RgbaImage, region: { x0: number; y0: number; width: number; height: number }): Uint8Array {
  const x0 = Math.round(region.x0);
  const y0 = Math.round(region.y0);
  const w = Math.round(region.width);
  const h = Math.round(region.height);
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * img.width + x0) * 4;
    out.set(img.data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}

// ── Scoring ──────────────────────────────────────────────────────────────

interface RelicDiff {
  index: number;
  expectedName: string | null;
  /** False when the fixture says the name isn't visible (name: null). */
  nameScored: boolean;
  nameOk: boolean;
  parsedName: string | null;
  matched: string[];
  missed: string[];
  spurious: string[];
  demeritsOk: number;
  demeritsTotal: number;
  demeritDiffs: string[];
  /** "right" | "unread" | "wrong" | "unscored" */
  colorResult: "right" | "unread" | "wrong" | "unscored";
  expectedColor: RelicColor | null;
  parsedColor: RelicColor | null;
}

interface FixtureResult {
  file: string;
  expectedRelics: number;
  parsedRelics: number;
  deepOk: boolean;
  diffs: RelicDiff[];
}

const newTally = () => ({
  fixtures: 0,
  effectsExpected: 0,
  effectsMatched: 0,
  effectsSpurious: 0,
  namesExpected: 0,
  namesOk: 0,
  demeritsExpected: 0,
  demeritsOk: 0,
  colorsRight: 0,
  colorsUnread: 0,
  colorsWrong: 0,
  deepOk: 0,
});
// Reassigned per configuration in --sweep mode; scoreFixture adds into it.
let tally = newTally();

function scoreFixture(
  file: string,
  fx: Fixture,
  groups: ReturnType<typeof parseRelicGroups>,
  allDeep: boolean,
  colors: (RelicColor | null)[],
): FixtureResult {
  const count = Math.max(fx.relics.length, groups.length);
  const diffs: RelicDiff[] = [];
  for (let i = 0; i < count; i++) {
    const exp = fx.relics[i] ?? { name: null, effects: [], demerits: [] };
    const got = groups[i];
    const gotEffects = got ? got.effects.map((e) => e.effect) : [];
    const expEffects = exp.effects ?? [];
    const matched = expEffects.filter((e) => gotEffects.includes(e));
    const missed = expEffects.filter((e) => !gotEffects.includes(e));
    const spurious = gotEffects.filter((e) => !expEffects.includes(e));

    // Demerits are compared per matched effect (a demerit rides its line).
    const expDem = new Map(expEffects.map((e, j) => [e, exp.demerits?.[j] || null]));
    const gotDem = new Map(gotEffects.map((e, j) => [e, (got?.demerits[j] ?? null) || null]));
    let demOk = 0;
    const demDiffs: string[] = [];
    for (const e of matched) {
      const want = expDem.get(e) ?? null;
      const have = gotDem.get(e) ?? null;
      if (want === have) demOk += 1;
      else demDiffs.push(`"${e}": expected demerit ${want ?? "none"}, got ${have ?? "none"}`);
    }

    const expectedColor = exp.color ?? null;
    const parsedColor = got ? colors[i] ?? null : null;
    const colorResult: RelicDiff["colorResult"] =
      expectedColor == null ? "unscored"
      : parsedColor == null ? "unread"
      : parsedColor === expectedColor ? "right"
      : "wrong";

    diffs.push({
      index: i,
      expectedName: exp.name ?? null,
      parsedName: got?.name ?? null,
      nameScored: i < fx.relics.length && exp.name != null,
      nameOk: (exp.name ?? null) === (got?.name ?? null),
      matched,
      missed,
      spurious,
      demeritsOk: demOk,
      demeritsTotal: matched.length,
      demeritDiffs: demDiffs,
      colorResult,
      expectedColor,
      parsedColor,
    });

    tally.effectsExpected += expEffects.length;
    tally.effectsMatched += matched.length;
    tally.effectsSpurious += spurious.length;
    if (i < fx.relics.length && exp.name != null) {
      tally.namesExpected += 1;
      if (exp.name === (got?.name ?? null)) tally.namesOk += 1;
    }
    tally.demeritsExpected += matched.length;
    tally.demeritsOk += demOk;
    if (colorResult === "right") tally.colorsRight += 1;
    else if (colorResult === "unread") tally.colorsUnread += 1;
    else if (colorResult === "wrong") tally.colorsWrong += 1;
  }
  const deepOk = allDeep === (fx.deep ?? false);
  if (deepOk) tally.deepOk += 1;
  tally.fixtures += 1;
  return { file, expectedRelics: fx.relics.length, parsedRelics: groups.length, deepOk, diffs };
}

// ── Parameter sweep (--sweep) ────────────────────────────────────────────
// The two parseRelicGroups thresholds were hand-tuned against the original
// fixture set; this grids over both, re-scoring the same cached OCR lines
// per configuration, and ranks by net effects (matched − spurious) — a
// misgrouped line costs one of each, so net is what grouping actually moves.

interface SweepEntry {
  file: string;
  fx: Fixture;
  lines: OcrLine[];
}

const SWEEP_BOUNDARY_STEPS = [1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.4];
const SWEEP_BLANK_SPANS = [0.8, 0.9, 1.0, 1.02, 1.05, 1.08, 1.1, 1.15, 1.2, 1.3, 1.4, 1.6];
const DEFAULT_TUNING = { boundaryStepPitches: 2.4, blankSpanPitches: 1.05 };

function runSweep(entries: SweepEntry[]) {
  const rows: { step: number; span: number; t: ReturnType<typeof newTally>; relicsExact: number }[] = [];
  for (const step of SWEEP_BOUNDARY_STEPS) {
    for (const span of SWEEP_BLANK_SPANS) {
      tally = newTally();
      let relicsExact = 0;
      for (const e of entries) {
        const groups = parseRelicGroups(e.lines, 6, { boundaryStepPitches: step, blankSpanPitches: span });
        const r = scoreFixture(e.file, e.fx, groups, screenIsDeep(groups), groups.map(() => null));
        if (r.parsedRelics === r.expectedRelics) relicsExact += 1;
      }
      rows.push({ step, span, t: tally, relicsExact });
    }
  }
  // Net effects first; grouping mistakes also misalign names, demerits, and
  // relic counts, so those break ties in that order.
  rows.sort(
    (a, b) =>
      b.t.effectsMatched - b.t.effectsSpurious - (a.t.effectsMatched - a.t.effectsSpurious) ||
      b.t.namesOk - a.t.namesOk ||
      b.t.demeritsOk - a.t.demeritsOk ||
      b.relicsExact - a.relicsExact,
  );
  console.log(`\nSweep over ${entries.length} fixtures (${rows.length} configurations):\n`);
  console.log("  step  span   net  effects        spur  names    demerits  relics= deep");
  for (const r of rows) {
    const isDefault =
      r.step === DEFAULT_TUNING.boundaryStepPitches && r.span === DEFAULT_TUNING.blankSpanPitches;
    console.log(
      `  ${r.step.toFixed(2).padEnd(5)} ${r.span.toFixed(2).padEnd(5)}` +
        ` ${String(r.t.effectsMatched - r.t.effectsSpurious).padStart(4)}` +
        `  ${`${r.t.effectsMatched}/${r.t.effectsExpected} (${pct(r.t.effectsMatched, r.t.effectsExpected)})`.padEnd(15)}` +
        ` ${String(r.t.effectsSpurious).padStart(4)}` +
        `  ${`${r.t.namesOk}/${r.t.namesExpected}`.padEnd(8)}` +
        ` ${`${r.t.demeritsOk}/${r.t.demeritsExpected}`.padEnd(9)}` +
        ` ${String(r.relicsExact).padStart(2)}/${entries.length}` +
        `   ${r.t.deepOk}/${r.t.fixtures}` +
        (isDefault ? "   ← current default" : ""),
    );
  }
}

// ── Reporting ────────────────────────────────────────────────────────────

const pct = (n: number, d: number) => (d === 0 ? "—" : `${Math.round((n / d) * 100)}%`);

function printFixture(r: FixtureResult, fx: Fixture) {
  const effExpected = fx.relics.reduce((n, x) => n + x.effects.length, 0);
  const effMatched = r.diffs.reduce((n, d) => n + d.matched.length, 0);
  const effSpurious = r.diffs.reduce((n, d) => n + d.spurious.length, 0);
  const namesScored = r.diffs.filter((d) => d.nameScored);
  const namesOk = namesScored.filter((d) => d.nameOk).length;
  const colors = r.diffs.map((d) => d.colorResult);
  const colorStr = colors.every((c) => c === "unscored")
    ? "unscored"
    : `${colors.filter((c) => c === "right").length}✓ ${colors.filter((c) => c === "unread").length}– ${colors.filter((c) => c === "wrong").length}✗`;

  console.log(`\n── ${r.file} ${"─".repeat(Math.max(3, 58 - r.file.length))}`);
  console.log(
    `  relics ${r.parsedRelics}/${r.expectedRelics} · names ${namesScored.length === 0 ? "–" : `${namesOk}/${namesScored.length}`}` +
      ` · effects ${effMatched}/${effExpected}${effSpurious ? ` (+${effSpurious} spurious)` : ""}` +
      ` · colors ${colorStr} · deep ${r.deepOk ? "✓" : "✗"}`,
  );
  for (const d of r.diffs) {
    const label = d.expectedName ?? d.parsedName ?? "(unnamed)";
    const issues: string[] = [];
    if (d.nameScored && !d.nameOk) issues.push(`name: expected ${d.expectedName ?? "none"}, got ${d.parsedName ?? "none"}`);
    if (!d.nameScored && d.parsedName != null) issues.push(`name: parser read "${d.parsedName}" but the fixture marks the name as not visible`);
    for (const e of d.missed) issues.push(`missed   ${e}`);
    for (const e of d.spurious) issues.push(`spurious ${e}`);
    issues.push(...d.demeritDiffs);
    if (d.colorResult === "wrong") issues.push(`color: expected ${d.expectedColor}, got ${d.parsedColor}`);
    if (d.colorResult === "unread") issues.push(`color: expected ${d.expectedColor}, couldn't read it`);
    if (issues.length > 0) {
      console.log(`  relic ${d.index + 1} (${label}):`);
      for (const line of issues) console.log(`    ${line}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const verbose = argv.includes("--verbose") || argv.includes("-v");
  const useCache = !argv.includes("--no-cache");
  const dumpColors = argv.includes("--dump-colors");
  const filterIdx = argv.indexOf("--filter");
  const filter = filterIdx >= 0 ? argv[filterIdx + 1] : null;
  const engineIdx = argv.indexOf("--engine");
  const engine = engineIdx >= 0 ? argv[engineIdx + 1] : "ocr";
  if (engine !== "ocr" && engine !== "claude") {
    console.error(`Unknown engine "${engine}" — use "ocr" (default) or "claude"`);
    process.exit(1);
  }
  const sweep = argv.includes("--sweep");
  if (sweep && engine !== "ocr") {
    console.error("--sweep tunes the OCR grouping thresholds — it has no meaning for the claude engine");
    process.exit(1);
  }

  if (!existsSync(FIXTURES_DIR)) {
    console.error(`No fixtures directory at ${FIXTURES_DIR} — see ocr-eval/README.md`);
    process.exit(1);
  }
  // A fixture is a screenshot (<name>.png/.jpeg) OR pre-supplied OCR lines
  // (<name>.lines.json) — the latter pins down grouping/matching cases whose
  // screenshot isn't available, skipping OCR and color sampling.
  const images = readdirSync(FIXTURES_DIR)
    .filter((f) => /(\.(png|jpe?g)|\.lines\.json)$/i.test(f))
    .filter((f) => !filter || f.includes(filter))
    .sort();
  if (images.length === 0) {
    console.error("No fixture screenshots found — add <name>.png + <name>.json to ocr-eval/fixtures/ (see ocr-eval/README.md)");
    process.exit(1);
  }

  // The tesseract worker is created lazily: fully-cached runs never load it.
  let worker: Worker | null = null;
  const getWorker = async () => {
    if (!worker) {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng", 1, { cachePath: CACHE_DIR });
      const params: Record<string, string> = {};
      const psm = OCR_EXP.find((f) => f.startsWith("psm="));
      if (psm) params.tessedit_pageseg_mode = psm.slice(4);
      if (OCR_EXP.includes("whitelist")) {
        params.tessedit_char_whitelist =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+&[]:%,.'- ";
      }
      if (Object.keys(params).length > 0) await worker.setParameters(params);
    }
    return worker;
  };

  const results: FixtureResult[] = [];
  const fixtures = new Map<string, Fixture>();
  const sweepEntries: SweepEntry[] = [];
  let fixtureErrors = 0;

  for (const image of images) {
    const base = image.replace(/(\.(png|jpe?g)|\.lines\.json)$/i, "");
    const jsonPath = path.join(FIXTURES_DIR, `${base}.json`);
    if (!existsSync(jsonPath)) {
      console.error(`✗ ${image}: no ${base}.json next to it — skipping`);
      fixtureErrors += 1;
      continue;
    }
    let fx: Fixture;
    try {
      fx = JSON.parse(readFileSync(jsonPath, "utf8")) as Fixture;
    } catch (e) {
      console.error(`✗ ${base}.json: invalid JSON (${(e as Error).message}) — skipping`);
      fixtureErrors += 1;
      continue;
    }
    const errors = validateFixture(fx, `${base}.json`);
    if (errors.length > 0) {
      for (const err of errors) console.error(`✗ ${err}`);
      fixtureErrors += 1;
      continue;
    }

    const isLinesFixture = /\.lines\.json$/i.test(image);
    const imagePath = path.join(FIXTURES_DIR, image);

    if (engine === "claude") {
      if (isLinesFixture) {
        console.log(`— ${image}: pre-supplied OCR lines carry no screenshot for the vision reader — skipped`);
        continue;
      }
      process.stdout.write(`reading ${image} with Claude…\n`);
      const read = parseVisionReply(await cachedVisionReply(imagePath, useCache));
      if (verbose) {
        read.groups.forEach((g, i) =>
          console.log(`  relic ${i + 1}: ${g.name ?? "(unnamed)"} · ${g.effects.map((e) => e.effect).join(" | ")}`),
        );
      }
      results.push(scoreFixture(image, fx, read.groups, read.deep, read.colors));
      fixtures.set(image, fx);
      continue;
    }

    process.stdout.write(`reading ${image}…\n`);
    const lines = isLinesFixture
      ? (JSON.parse(readFileSync(imagePath, "utf8")) as OcrLine[])
      : await cachedOcrLines(getWorker, imagePath, useCache);
    if (sweep) {
      sweepEntries.push({ file: image, fx, lines });
      continue;
    }
    if (verbose) {
      console.log(`  OCR lines (${lines.length}):`);
      for (const l of lines) console.log(`    | ${l.text.trimEnd()}`);
    }

    // Same pipeline as ScreenshotImport.tsx.
    const groups = parseRelicGroups(lines);
    const allDeep = screenIsDeep(groups);
    const img = isLinesFixture ? null : decodeImage(imagePath);
    const colors = groups.map((g) => {
      // A joined wrapped line has no single OCR line with identical text, so
      // fall back to the line the joined text starts with.
      const first = g.effects[0]?.line.trim() ?? null;
      const box = first
        ? (lines.find((l) => l.text.trim() === first) ??
            lines.find((l) => l.text.trim().length >= 8 && first.startsWith(l.text.trim())))?.bbox ?? null
        : null;
      // The app derives the color from a scene name when one was read
      // (BuildEditor does the same) — pixels are the fallback.
      const named = colorFromRelicName(g.name);
      if (named) return named;
      const idx = groups.indexOf(g) + 1;
      if (!box || !img) {
        if (dumpColors) console.log(`  ${image} r${idx}: ${!img ? "image undecodable" : `no bbox for "${first}"`}`);
        return null;
      }
      const region = iconSampleRegion(box, img.height);
      if (!region) {
        if (dumpColors) console.log(`  ${image} r${idx}: region too small (text x0=${box.x0})`);
        return null;
      }
      const pixels = cropRgba(img, region);
      const color = dominantIconColor(pixels);
      if (dumpColors) {
        console.log(`  ${image} r${idx}: box x0=${box.x0} y0=${box.y0} h=${box.y1 - box.y0} → region x=${Math.round(region.x0)}..${Math.round(region.x0 + region.width)} y=${Math.round(region.y0)}..${Math.round(region.y0 + region.height)} → ${color ?? "null"}`);
        const base = image.replace(/\.(png|jpe?g)$/i, "");
        const out = new PNG({ width: Math.round(region.width), height: Math.round(region.height) });
        out.data = Buffer.from(pixels);
        const dir = path.join(CACHE_DIR, "colors");
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, `${base}-r${idx}-${color ?? "null"}.png`), PNG.sync.write(out));
      }
      return color;
    });

    results.push(scoreFixture(image, fx, groups, allDeep, colors));
    fixtures.set(image, fx);
  }

  if (worker) await (worker as Worker).terminate();

  if (sweep) {
    runSweep(sweepEntries);
    if (fixtureErrors > 0) process.exitCode = 1;
    return;
  }

  for (const r of results) printFixture(r, fixtures.get(r.file)!);

  const colorsScored = tally.colorsRight + tally.colorsUnread + tally.colorsWrong;
  console.log(`\n${"━".repeat(64)}`);
  console.log(
    `TOTALS · ${engine === "claude" ? `claude vision (${visionModel}, prompt ${VISION_PROMPT_VERSION}) · ` : ""}${tally.fixtures} fixture${tally.fixtures === 1 ? "" : "s"}${fixtureErrors ? ` (${fixtureErrors} skipped with errors)` : ""}`,
  );
  console.log(`  effects   ${tally.effectsMatched}/${tally.effectsExpected} matched (${pct(tally.effectsMatched, tally.effectsExpected)}) · ${tally.effectsSpurious} spurious`);
  console.log(`  names     ${tally.namesOk}/${tally.namesExpected} (${pct(tally.namesOk, tally.namesExpected)})`);
  console.log(`  demerits  ${tally.demeritsOk}/${tally.demeritsExpected} (${pct(tally.demeritsOk, tally.demeritsExpected)})`);
  console.log(
    colorsScored === 0
      ? "  colors    unscored (no fixture sets expected colors)"
      : `  colors    ${tally.colorsRight} right · ${tally.colorsUnread} unread · ${tally.colorsWrong} wrong (${pct(tally.colorsRight, colorsScored)} of scored)`,
  );
  console.log(`  deep flag ${tally.deepOk}/${tally.fixtures}`);
  if (fixtureErrors > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
