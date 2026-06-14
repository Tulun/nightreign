# Nightreign Field Grimoire

A personal quick-reference app for Elden Ring Nightreign, built with Next.js.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to the Town Map Seeds view.

## Where things live

- `src/data/sets.ts` — **your data**. The 21 sets (0–20), their weapon name +
  passive, and each town merchant's items. Edit this constantly.
- `public/icons/` — weapon images. Reference them via `weapon.icon`.
- `src/components/` — UI pieces (`SetCard`, `MerchantSection`, `WeaponIcon`,
  `Sidebar`).
- `src/app/town-map/` — the seed grid (`page.tsx`) and the per-seed merchant
  detail (`[seedId]/page.tsx`).

## Adding a new reference view later

1. Create `src/app/<your-view>/page.tsx`.
2. Add it to the `sections` list in `src/components/Sidebar.tsx` and remove its
   `soon` flag.

## Build for a "real" local host

```bash
npm run build
npm run start   # serves the production build on http://localhost:3000
```

## Deploy to GitHub Pages

The app is configured to publish as a **static export** to
`https://tulun.github.io/nightreign/`.

### One-time repo setup

In the GitHub repo: **Settings → Pages → Build and deployment → Source =
"GitHub Actions"**. That's it — no branch to pick.

### How deploys happen

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the static site and publishes it. To ship an update, just commit
and push:

```bash
git add -A && git commit -m "update data" && git push
```

Watch progress under the repo's **Actions** tab. First deploy can take a couple
of minutes to go live.

### What makes it work (in `next.config.mjs`)

- `output: "export"` — `next build` emits a static site to `./out`.
- `basePath` / `assetPrefix: "/nightreign"` — because a project site lives under
  `/<repo>/`. Applied **only** when `GITHUB_PAGES=true` (the workflow sets it),
  so local dev/build stay at the root.
- `images: { unoptimized: true }` — GitHub Pages has no image server.
- `trailingSlash: true` — routes export as `town-map/index.html` so Pages serves
  `/town-map/` cleanly.
- `public/.nojekyll` — stops GitHub's Jekyll from dropping the `_next/` folder.

> If you ever move this to a custom domain or a `tulun.github.io` root repo, drop
> the `basePath`/`assetPrefix` (serve from `/`).

### Build / preview the static export locally

```bash
npm run build            # plain export to ./out (no base path — easy to preview)
npm run preview:pages    # serve ./out at http://localhost:3000

npm run build:pages      # export exactly as deployed (with the /nightreign base path)
```

> Preview with `npm run build` (not `build:pages`): the `/nightreign` base path
> only resolves under that sub-path, so a base-path build won't load correctly
> from `localhost` root.
