# Weapon icons (town-map sets)

Art for the weapons listed in the town-map sets. Drop images here, then map
each one **by weapon name** in [`src/data/weaponIcons.ts`](../../../src/data/weaponIcons.ts).
Mapping by name means you add a weapon's art **once** and it shows in every set
that sells it (e.g. `Golem Greatbow` appears in 12 sets).

## Workflow

1. Save the image in this folder.
2. Add a line to `src/data/weaponIcons.ts`, keyed by the **exact** name from
   `src/data/sets.ts`:

   ```ts
   "Rivers of Blood": "/icons/weapons/rivers-of-blood.webp",
   ```

That's it — the set cards and the set-detail signature header pick it up. Until
a weapon is mapped, it shows the framed blade-glyph placeholder.

## Conventions

- **Filename** — kebab-case of the name: `Golem Greatbow` → `golem-greatbow.webp`,
  `Crepus's Black Crossbow` → `crepuss-black-crossbow.webp` (drop apostrophes).
  This is only a recommendation; the path in `weaponIcons.ts` is what actually
  matters, so any filename works as long as they match.
- **Format** — square PNG or WEBP, ~128×128, transparent background preferred.
- **Path** — must start with `/icons/weapons/` (relative to `/public`).
