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
- `characters/<name>.png` — Nightfarer class icons, kebab-case name from
  `src/data/characters.ts` (`wylder.png`, `ironeye.png`, …). All 10 present,
  70×70 RGBA. These are the game's portrait busts, not abstract sigils — the
  wiki has no emblem-style symbol art. Sourced from
  [Fextralife](https://eldenringnightreign.wiki.fextralife.com/Nightfarers+(Classes)).
- `cocktails/`, `elements/`, `status/` — art for those features.
- `effects/<category>.png` — the small glyphs the game shows beside each relic
  effect line (sword = attack, armor = defense, bag = item, …). 80×80 RGBA, the
  game's own `GSBg` ("grey square background") variant — the one used in the
  relic effect list, so a row on the site matches what you read in-game.
  Sourced from [Eldenpedia](https://eldenring.wiki.gg/wiki/Nightreign:Relics),
  which publishes them as `ERN_Effect_Icon_GSBg_<Category>.png`; filenames here
  are the kebab-case category (`Weapon_Skill_Up` → `weapon-skill-up.png`).
  The set is complete for generic categories. Variants that exist in-game but
  aren't here: `NoBg` (frameless, used in the buff HUD), `GDBg` (diamond, used
  for affinities and resistances), `BSBg` (blue, used for character abilities).

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
