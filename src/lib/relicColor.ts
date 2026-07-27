// ─────────────────────────────────────────────────────────────────────────
//  Relic-icon color sampling, shared by the screenshot importer (browser)
//  and the OCR eval harness (Node). Pure pixel math — no DOM dependencies.
// ─────────────────────────────────────────────────────────────────────────

export type RelicColor = "Red" | "Blue" | "Green" | "Yellow";

/** Infer a relic color from a scene name (Drizzly=Blue, Tranquil=Green in-game). */
export function colorFromRelicName(name: string | null): RelicColor | null {
  if (!name) return null;
  if (/burning/i.test(name)) return "Red";
  if (/drizzly/i.test(name)) return "Blue";
  if (/tranquil/i.test(name)) return "Green";
  if (/luminous/i.test(name)) return "Yellow";
  return null;
}

export interface IconBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SampleRegion {
  x0: number;
  y0: number;
  width: number;
  height: number;
}

/**
 * The image region left of a relic's first effect line where its icon glows
 * in the relic's color. On list screens the icon sits directly beside the
 * effect block, so the region hugs the text — reaching further left only
 * finds background (or, on photos, the TV bezel). Returns null when the
 * region would be too small to sample (effect text at the image edge).
 */
export function iconSampleRegion(bbox: IconBox, imageHeight: number): SampleRegion | null {
  const lineH = Math.max(8, bbox.y1 - bbox.y0);
  const x1 = Math.max(0, bbox.x0 - lineH * 0.5);
  const x0 = Math.max(0, bbox.x0 - lineH * 5);
  const y0 = Math.max(0, bbox.y0 - lineH);
  const height = Math.min(imageHeight - y0, lineH * 4);
  if (x1 - x0 < 8 || height < 8) return null;
  return { x0, y0, width: x1 - x0, height };
}

/**
 * Dominant relic color in an RGBA region, or null when no icon glow can be
 * made out. The icon's colored glow is the brightest, most saturated thing
 * in its region, so classification looks only at the most vivid decile of
 * pixels — a small bright flame outvotes acres of dull tinted UI. Regions
 * with no vivid pixels at all (dark background), or whose vivid pixels are
 * a flat single-vividness field (a TV bezel, a scrollbar — backgrounds have
 * no glow that stands out), return null rather than their cast.
 */
export function dominantIconColor(rgba: Uint8ClampedArray | Uint8Array): RelicColor | null {
  const vivid: { h: number; w: number }[] = [];
  let sampled = 0;
  for (let i = 0; i < rgba.length; i += 16) {
    sampled += 1;
    const r = rgba[i] / 255;
    const g = rgba[i + 1] / 255;
    const b = rgba[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 0.25 || max - min < 0.15) continue; // dark or gray
    const d = max - min;
    let h = 0;
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    vivid.push({ h, w: d * max });
  }
  if (sampled === 0 || vivid.length < 40) return null;
  const totalWeight = vivid.reduce((n, p) => n + p.w, 0);
  if (totalWeight / sampled < 0.02) return null;

  vivid.sort((a, b) => b.w - a.w);
  const glow = vivid.slice(0, Math.max(30, Math.ceil(vivid.length / 10)));
  const glowMean = glow.reduce((n, p) => n + p.w, 0) / glow.length;
  const allMean = totalWeight / vivid.length;
  // Vivid pixels everywhere but no glow standing out = a flat colored field.
  if (vivid.length / sampled > 0.35 && glowMean < 1.5 * allMean) return null;

  const weights = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
  for (const p of glow) {
    if (p.h < 25 || p.h >= 330) weights.Red += p.w;
    else if (p.h < 70) weights.Yellow += p.w;
    else if (p.h < 170) weights.Green += p.w;
    else if (p.h < 270) weights.Blue += p.w;
  }
  const glowWeight = glow.reduce((n, p) => n + p.w, 0);
  const [best] = (Object.entries(weights) as [RelicColor, number][]).sort((a, b) => b[1] - a[1]);
  if (best[1] / glowWeight < 0.5) return null;
  // The game's whole UI is blue — screen furniture, deep-relic wreaths, and
  // photo casts all read as blue glow, and on the eval set every wrong
  // verdict ever produced was Blue. A blue verdict from pixels is noise;
  // Blue relics get their color from the scene name instead.
  if (best[0] === "Blue") return null;
  return best[0];
}
