# Split-affinity icons

Diagonal two-affinity icons, used in the Recluse cocktail recipe rows (the
middle slot of a 2-affinity brew) and beside weapons with two elemental
affinities.

Filenames are **`<a>-<b>.png`** where the pair is in this canonical order:
`magic → fire → lightning → holy` (see `AFFINITY_ORDER` in `src/lib/cocktails.ts`).

The six combinations:

| File | Combo |
|------|-------|
| `magic-fire.png` | Magic + Fire |
| `magic-lightning.png` | Magic + Lightning |
| `magic-holy.png` | Magic + Holy |
| `fire-lightning.png` | Fire + Lightning |
| `fire-holy.png` | Fire + Holy |
| `lightning-holy.png` | Lightning + Holy |

Until a file is present, the recipe row shows a dashed `?` placeholder in that
slot. Square PNGs (~64px) match the existing affinity icons.
