# Weapon icons

Drop weapon images here (PNG/WEBP/SVG), then point a seed at one in
`src/data/seeds.ts`:

```ts
weapon: {
  name: "St. Trina's Sword",
  passive: "Lightning damage negation up",
  icon: "/icons/st-trinas-sword.png", // path is relative to /public
}
```

Until `icon` is set, a framed placeholder with a blade glyph is shown.
Square images (e.g. 128×128) look best.
