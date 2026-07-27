# Nightreign Field Grimoire

A personal quick-reference app for Elden Ring Nightreign, built with Next.js.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to the Town Map Seeds view.

### Sample builds for testing

Add `?seed=<name>` to any URL to replace the browser's build store with a
fixture, so My Builds / My Relics / the party planner are populated without
entering relics by hand:

```
http://localhost:3000/builds?seed=demo     sample builds, relics, tags, variants
http://localhost:3000/builds?seed=empty    wipe back to the first-run state
```

The page reloads with the parameter stripped. Three guards keep fixtures away
from a real account:

- Seeding only works on localhost — the deployed site ignores the parameter
  entirely, and never even fetches the fixture chunk.
- It refuses while signed in, since the seeded store would sync straight into
  the account. Refusals show as a notice in the corner.
- A seeded store is marked (`nightreign-dev-seeded`), and `useCloudSync`
  refuses to sync while that marker is set — that covers the other order,
  seed first and sign in after. `?seed=empty` clears the marker, and the
  stub backend is exempt. Dev builds only: the check compiles out of the
  deployed site.

Fixtures live in `src/data/devSeeds.ts`; every seeded id starts with `seed-`.

### Fake cloud (testing signed-in and multi-user flows)

Sign-in is a Google popup and the directory is real Firestore, which makes
anything multi-user awkward to test — and seeding a real account with test
data is worse. So there's a stub backend: no Firebase, no popup, everything in
localStorage.

```bash
npm run dev:fake
```

Sign in from the header and you're `Nightfarer-fake`, with four other fixture
accounts, published parties, and a cloud store that deliberately disagrees with
`?seed=demo` — so the sign-in merge has something real to resolve. Drive it
from the URL:

```
?cloud=signin     sign in as the fixture account (?cloud=signout to leave)
?cloud=reset      back to the fixture accounts, signed out
?cloud=empty      a directory with nobody in it
?cloud=timeout    every cloud read fails (also: denied, unavailable)
```

`?seed=<name>` resets the stub too, so the two stay in step. The account
`BrokenSync` always fails its store read, so the per-user error path shows up
inside an otherwise healthy directory. In the console, `window.__fakeCloud`
exposes `state()`, `reset()`, `scenario()`, `signIn()`, `signOut()` and
`remoteEdit(uid, fn)` — that last one stands in for another device pushing an
edit, which is the only way to reach the live-merge branch of `useCloudSync`.

Everything routes through `src/lib/cloud.ts`, which picks the real backend or
`src/lib/fakeCloud.ts` from `NEXT_PUBLIC_FAKE_CLOUD`; `next.config.mjs` swaps
the stub for an empty module in any build without the flag, so none of it ships.
What it can't test: Firestore security rules, and the real popup sign-in.

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
