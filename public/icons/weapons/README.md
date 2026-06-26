# Weapon icons (town-map sets)

Art for the weapons, organised by weapon **type**. Icons resolve automatically
**by name** via `iconFor` in [`src/data/weaponIcons.ts`](../../../src/data/weaponIcons.ts):
it looks up the weapon's type and derives the path below, so you just drop a
correctly-named file in the right folder — no code change needed. The art then
shows everywhere the weapon appears (shop cards, merchant rows, weapon page).

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

Just save the image in its type folder, named to match the weapon — that's it:

```
whips/magma-whip-candlestick.png
straight-swords/coded-sword.png
```

Until a weapon's file exists it shows the framed blade-glyph placeholder.

## Conventions

- **Filename** — kebab-case of the name with apostrophes dropped: `Golem Greatbow`
  → `golem-greatbow.png`, `Crepus's Black-Key Crossbow` → `crepuss-black-key-crossbow.png`,
  `Great Épée` → `great-epee.png` (accents stripped). This must match, since the
  path is derived from the name.
- **Format** — square PNG or WEBP, ~128×128, transparent background preferred.
- **Path** — `/icons/weapons/<type-plural>/<name>.png` (relative to `/public`).
