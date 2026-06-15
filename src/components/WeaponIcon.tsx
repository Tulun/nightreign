import Image from "next/image";
import type { Tier } from "@/lib/tiers";
import { TIER_STYLES } from "@/lib/tiers";
import { asset } from "@/lib/assets";

interface WeaponIconProps {
  src?: string;
  alt: string;
  /** Pixel size of the square. Defaults to 64. */
  size?: number;
  /** Optional tier — colours the frame to match the entry's rarity. */
  tier?: Tier;
}

/**
 * Renders the weapon's icon if `src` is set, otherwise a framed placeholder
 * with a simple blade glyph. Drop images in /public/icons and set an entry's
 * `icon` in src/data/sets.ts to replace the placeholder.
 */
export function WeaponIcon({ src, alt, size = 64, tier }: WeaponIconProps) {
  const ring = tier ? TIER_STYLES[tier].bar : undefined;

  return (
    <div
      className="frame relative grid shrink-0 place-items-center overflow-hidden rounded bg-night-900"
      style={{
        width: size,
        height: size,
        ...(ring ? { borderColor: ring, boxShadow: `0 0 0 1px ${ring}55` } : {}),
      }}
    >
      {src ? (
        <Image src={asset(src)} alt={alt} fill sizes={`${size}px`} className="object-contain p-1.5" />
      ) : (
        <BladeGlyph />
      )}
    </div>
  );
}

function BladeGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-1/2 w-1/2 text-gold-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 3.5 7 11l2 2 7.5-7.5z" />
      <path d="M8 12l-3 3 1 1 3-3" />
      <path d="m6 16-2.5 2.5M9 19l2-2" />
    </svg>
  );
}
