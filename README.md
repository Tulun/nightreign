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
