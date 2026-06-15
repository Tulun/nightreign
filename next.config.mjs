/** @type {import('next').NextConfig} */

// Set GITHUB_PAGES=true (the deploy workflow does) to build a static export
// rooted under /nightreign for https://tulun.github.io/nightreign/.
// Without it, local `next dev` / `next build` run base-path-free.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = "nightreign"; // GitHub repo name → project-site path segment
const basePath = isGithubPages ? `/${repo}` : "";

const nextConfig = {
  output: "export", // emit a static site to ./out on `next build`
  images: { unoptimized: true }, // no image-optimization server on GitHub Pages
  basePath,
  assetPrefix: isGithubPages ? `/${repo}/` : "",
  trailingSlash: true, // /town-map/ → town-map/index.html, served cleanly by Pages
  // next/image does NOT prefix basePath onto image src under static export, so
  // expose it to the client and prepend it manually (see src/lib/assets.ts).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
