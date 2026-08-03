// ─────────────────────────────────────────────────────────────────────────
//  Image preprocessing for OCR, shared by the screenshot importer (browser
//  canvas pixels) and the eval harness (decoded file pixels). Pure math on
//  RGBA buffers — no DOM or Node dependencies.
// ─────────────────────────────────────────────────────────────────────────

export interface RawImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

/**
 * Grayscale + invert + percentile contrast stretch. Game text is light on a
 * dark blue field; tesseract reads it more reliably as high-contrast dark
 * text on white. Run as a SECOND pass alongside the original — it recovers
 * lines the original misses (especially on dim TV photos) but can also lose
 * lines the original reads, so neither pass is authoritative alone.
 */
export function grayInvertStretch(img: RawImage): RawImage {
  return invertStretch(img, (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Like grayInvertStretch, but grayscales by the brightest channel instead of
 * Rec.601 luminance. Demerit lines render as light blue on the dark blue UI;
 * luminance weights blue at 0.114, so that text all but vanishes in the gray
 * pass. Taking max(R,G,B) keeps blue text as bright as white text. A third
 * competing pass — pickBestOcrPass decides per image.
 */
export function maxChannelInvertStretch(img: RawImage): RawImage {
  return invertStretch(img, (r, g, b) => Math.max(r, g, b));
}

function invertStretch(img: RawImage, lumOf: (r: number, g: number, b: number) => number): RawImage {
  const n = img.width * img.height;
  const lum = new Uint8Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    const v = Math.round(lumOf(img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]));
    lum[i] = v;
    hist[v] += 1;
  }
  // 2nd/98th percentile bounds from the histogram.
  let lo = 0, hi = 255, acc = 0;
  const loTarget = n * 0.02, hiTarget = n * 0.98;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc <= loTarget) lo = v;
    if (acc <= hiTarget) hi = v;
  }
  const range = Math.max(1, hi - lo);
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const stretched = Math.max(0, Math.min(255, ((lum[i] - lo) / range) * 255));
    const inv = 255 - stretched;
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = inv;
    out[i * 4 + 3] = 255;
  }
  return { width: img.width, height: img.height, data: out };
}
