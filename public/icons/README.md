# Icons

Image assets, grouped by feature:

- `weapons/` — town-map set weapon art, in per-type subfolders, with rarity
  backdrops under `weapons/backgrounds/`. **Mapped by weapon name** in
  [`src/data/weaponIcons.ts`](../../src/data/weaponIcons.ts) — see that folder's
  README for the layout and workflow.
- `cocktails/`, `elements/`, `greatshields/`, `status/` — art for those features.

## Town-map weapons (quick version)

1. Drop the image in its weapon-type folder, e.g.
   `weapons/straight-swords/coded-sword.png`.
2. Add a line to `src/data/weaponIcons.ts`, keyed by the exact weapon name from
   `src/data/sets.ts`:

   ```ts
   "Coded Sword": "/icons/weapons/straight-swords/coded-sword.png",
   ```

A weapon with no entry shows the framed blade-glyph placeholder, so the registry
can be filled in gradually. Square images (~128×128) look best.
