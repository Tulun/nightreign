import Image from "next/image";
import type { Tier } from "@/lib/tiers";
import { TIER_STYLES, TIER_FRAMES } from "@/lib/tiers";
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
 * with a simple blade glyph. When the weapon's `tier` has a decorative backdrop
 * (see TIER_FRAMES), the weapon art is composited on top of it; otherwise the
 * plain CSS frame is used. Weapon art is mapped by name in src/data/weaponIcons.ts.
 */
export function WeaponIcon({ src, alt, size = 64, tier }: WeaponIconProps) {
  const ring = tier ? TIER_STYLES[tier].bar : undefined;
  // Backdrop only applies once there's a weapon image to sit on it.
  const frame = src && tier ? TIER_FRAMES[tier] : undefined;

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded ${
        frame ? "" : "frame bg-night-900"
      }`}
      style={{
        width: size,
        height: size,
        ...(!frame && ring ? { borderColor: ring, boxShadow: `0 0 0 1px ${ring}55` } : {}),
      }}
    >
      {frame && (
        // Scaled up so the purple square fills the box (the source art has
        // transparent margin + a smoke wisp around the frame).
        <Image
          src={asset(frame)}
          alt=""
          aria-hidden
          fill
          sizes={`${size}px`}
          className="scale-[1.35] object-cover"
        />
      )}
      {src ? (
        <Image
          src={asset(src)}
          alt={alt}
          fill
          sizes={`${size}px`}
          className={`object-contain ${frame ? "p-[18%]" : "p-1.5"}`}
        />
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
