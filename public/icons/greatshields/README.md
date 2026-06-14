# Greatshield icons

Drop square greatshield images here (PNG/WEBP/SVG), then point an entry at one
in `src/data/greatshields.ts`:

```ts
{
  id: "jellyfish-shield",
  name: "Jellyfish Shield",
  icon: "/icons/greatshields/jellyfish-shield.png", // path is relative to /public
  negation: { physical: 100, magic: 59, fire: 66, lightning: 53, holy: 62 },
  guardBoost: 60,
}
```

Until `icon` is set, a framed placeholder with a shield glyph is shown.
Square images (e.g. 128×128) look best.
