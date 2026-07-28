# Nightreign Field Grimoire

A personal quick-reference app for Elden Ring Nightreign, built with Next.js.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to the Town Map Seeds view.

### Sample builds for testing

Builds and relics belong to a signed-in account (see below), so `?seed=<name>`
loads a fixture into the **stub backend's** account and signs you in as it —
My Builds / My Relics / the party planner populated without entering relics by
hand. It needs `npm run dev:fake`:

```
http://localhost:3000/builds?seed=demo     sample builds, relics, tags, variants
http://localhost:3000/builds?seed=empty    an account with nothing in it
```

The page reloads with the parameter stripped. Two guards keep fixtures away
from a real account:

- Seeding only works on localhost — the deployed site ignores the parameter
  entirely, and never even fetches the fixture chunk.
- It refuses without the stub backend, so the only account a fixture can reach
  is the stub's. Refusals show as a notice in the corner.

Seeding resets the stub first and clears the local cache of the account it
writes, so the fixture is exactly what you get.

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
accounts and published parties. Drive it from the URL:

```
?cloud=signin     sign in as the fixture account (?cloud=signout to leave)
?cloud=reset      back to the fixture accounts, signed out
?cloud=empty      a directory with nobody in it
?cloud=timeout    every cloud read fails (also: denied, unavailable)
```

The account `BrokenSync` always fails its store read, so the per-user error
path shows up inside an otherwise healthy directory, and `?cloud=timeout` on
your own account is how you reach the Builds page's offline state — the local
cache standing in for an unreachable database. In the console,
`window.__fakeCloud` exposes `state()`, `reset()`, `scenario()`, `signIn()`,
`signOut()` and `remoteEdit(uid, fn)` — that last one stands in for another
device pushing an edit, which is the only way to reach the live-merge branch
of `useAccountStore`.

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
