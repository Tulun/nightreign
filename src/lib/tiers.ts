// Visual tier coding carried over from the source reference sheets.
// grey = common, blue, purple. Shades are tuned to read clearly on the dark
// theme while keeping the blue vs purple distinction unmistakable.

export type Tier = "common" | "blue" | "purple";

export interface TierStyle {
  /** Solid color for the left accent bar and ring. */
  bar: string;
  /** Subtle row background wash. */
  bg: string;
}

export const TIER_STYLES: Record<Tier, TierStyle> = {
  common: { bar: "#8b93a1", bg: "rgba(139, 147, 161, 0.10)" },
  blue: { bar: "#3ea6e0", bg: "rgba(62, 166, 224, 0.13)" },
  purple: { bar: "#a571e6", bg: "rgba(165, 113, 230, 0.16)" },
};

/** Yellow used for highlighted (originally yellow-text) entries. */
export const HIGHLIGHT_COLOR = "#f2cb3c";

/**
 * Decorative rarity backdrop composited BEHIND a weapon icon (the swirl + frame
 * art in /public/icons/weapons/). A weapon image with a transparent background
 * is layered on top. Tiers without a backdrop fall back to the plain CSS frame.
 * Add blue.png / common.png here as you make them.
 */
export const TIER_FRAMES: Partial<Record<Tier, string>> = {
  purple: "/icons/weapons/purple.png",
  // blue: "/icons/weapons/blue.png",
  // common: "/icons/weapons/common.png",
};
