# Weapon icons (town-map sets)

Art for the weapons listed in the town-map sets, organised by weapon **type** so
it stays manageable as more weapons are added. Map each one **by weapon name** in
[`src/data/weaponIcons.ts`](../../../src/data/weaponIcons.ts). Mapping by name
means you add a weapon's art **once** and it shows in every set that sells it.

## Folder layout

```
weapons/
  backgrounds/        rarity backdrops: white, blue, purple, yellow (.png)
  straight-swords/    one folder per weapon TYPE …
  great-spears/
  whips/
  reapers/
  …
```

Weapon type comes from `src/data/weapons.ts`; the folder is its kebab-case,
pluralised form — e.g. `Curved Greatsword` → `curved-greatswords/`,
`Whip` → `whips/`, `Straight Sword` → `straight-swords/`.

## Workflow

1. Save the image in its type folder, e.g. `whips/magma-whip-candlestick.png`.
2. Add a line to `src/data/weaponIcons.ts`, keyed by the **exact** name from
   `src/data/sets.ts`:

   ```ts
   "Coded Sword": "/icons/weapons/straight-swords/coded-sword.png",
   ```

That's it — the set cards, set-detail signature, and merchant rows pick it up.
Until a weapon is mapped, it shows the framed blade-glyph placeholder.

## Conventions

- **Filename** — kebab-case of the name: `Golem Greatbow` → `golem-greatbow.png`,
  `Crepus's Black Crossbow` → `crepuss-black-crossbow.png` (drop apostrophes).
  This is only a recommendation; the path in `weaponIcons.ts` is what actually
  matters, so any filename works as long as they match.
- **Format** — square PNG or WEBP, ~128×128, transparent background preferred.
- **Path** — `/icons/weapons/<type-plural>/<file>` (relative to `/public`).
