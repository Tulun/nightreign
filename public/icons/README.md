# Icons

Image assets, grouped by feature. Weapon and shield art is resolved **by name**
in [`src/data/weaponIcons.ts`](../../src/data/weaponIcons.ts) (`iconFor`) — there's
no per-item wiring, you just drop a correctly-named file in the right folder.

- `weapons/<type>/` — weapon art, one folder per weapon type from
  `src/data/weapons.ts` (e.g. `weapons/straight-swords/coded-sword.png`). Rarity
  backdrops live in `weapons/backgrounds/` (white/blue/purple/yellow).
- `greatshields/<id>.png` — greatshields, keyed by id in `src/data/greatshields.ts`.
- `small-shields/<id>.png`, `medium-shields/<id>.png` — small/medium shields,
  keyed by id in `src/data/shields.ts`.
- `cocktails/`, `elements/`, `status/` — art for those features.

## Adding weapon / shield art

Drop a square PNG (~128×128, transparent background) into the right folder, named
to match the item:

- **Weapon** → `weapons/<type-plural>/<name>.png`, e.g.
  `weapons/colossal-swords/troll-knights-sword.png`. Filename is the kebab-case
  name with apostrophes dropped.
- **Shield** → `<class>-shields/<id>.png`, using the `id` from `greatshields.ts`
  or `shields.ts`, e.g. `medium-shields/kite-shield.png`.

That's it — it shows up in the shop and weapon page automatically. Until the file
exists, the item shows the framed blade-glyph placeholder.
