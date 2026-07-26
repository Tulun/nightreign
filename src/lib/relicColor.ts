// ─────────────────────────────────────────────────────────────────────────
//  Relic-icon color sampling, shared by the screenshot importer (browser)
//  and the OCR eval harness (Node). Pure pixel math — no DOM dependencies.
// ─────────────────────────────────────────────────────────────────────────

export type RelicColor = "Red" | "Blue" | "Green" | "Yellow";

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
 * in the relic's color. Returns null when the region would be too small to
 * sample (effect text at the image edge).
 */
export function iconSampleRegion(bbox: IconBox, imageHeight: number): SampleRegion | null {
  const lineH = Math.max(8, bbox.y1 - bbox.y0);
  const x0 = Math.max(0, bbox.x0 - lineH * 10);
  const width = Math.min(bbox.x0, lineH * 9);
  const y0 = Math.max(0, bbox.y0 - lineH);
  const height = Math.min(imageHeight - y0, lineH * 4);
  if (width < 8 || height < 8) return null;
  return { x0, y0, width, height };
}

/**
 * Dominant relic color among an RGBA region's saturated pixels, or null when
 * too few pixels are colored (or no color clearly wins) to call it.
 */
export function dominantIconColor(rgba: Uint8ClampedArray | Uint8Array): RelicColor | null {
  const counts = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
  let total = 0;
  for (let i = 0; i < rgba.length; i += 16) {
    const r = rgba[i] / 255;
    const g = rgba[i + 1] / 255;
    const b = rgba[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 0.2 || max - min < 0.12) continue; // dark or gray
    const d = max - min;
    let h = 0;
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    total += 1;
    if (h < 25 || h >= 330) counts.Red += 1;
    else if (h < 70) counts.Yellow += 1;
    else if (h < 170) counts.Green += 1;
    else if (h < 270) counts.Blue += 1;
  }
  const [best] = (Object.entries(counts) as [RelicColor, number][]).sort((a, b) => b[1] - a[1]);
  return total >= 40 && best[1] / total >= 0.45 ? best[0] : null;
}
