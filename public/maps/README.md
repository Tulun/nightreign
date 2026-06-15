# Great Hollow maps

Drop the two map images here (watermark-free), then they show on the
`/great-hollow` page with the crystal markers overlaid:

- `great-hollow-surface.png`
- `great-hollow-underground.png`

Notes:
- Use square images (the data assumes ~1080×1080). If yours differ, set the
  matching `width`/`height` for that map in `src/data/greatHollow.ts` so the
  aspect ratio is correct.
- Marker positions are percentages in `src/data/greatHollow.ts` (`x`/`y`).
  Nudge them to line up with your image, and adjust `MARKER_SIZE` in
  `src/components/GreatHollowMaps.tsx` for the crystal size.
