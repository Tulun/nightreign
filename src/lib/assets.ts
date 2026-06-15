// Prefix root-relative public asset paths (e.g. "/icons/...") with the base
// path. Required for GitHub Pages: under static export, next/image does not
// add `basePath` to image `src`, so we do it here. The value is inlined at
// build time via next.config.mjs `env` (empty for local dev/build).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return path && path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
