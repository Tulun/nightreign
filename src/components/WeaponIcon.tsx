"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Tier } from "@/lib/tiers";
import { TIER_STYLES, TIER_FRAMES } from "@/lib/tiers";
import { asset } from "@/lib/assets";

interface WeaponIconProps {
  src?: string;
  alt: string;
  /** Pixel size of the square. Defaults to 64. */
  size?: number;
  /** Convenience: derives the backdrop + ring from a town-map tier. */
  tier?: Tier;
  /** Explicit rarity backdrop path (overrides `tier`); used by the weapon page. */
  frame?: string;
  /** Explicit ring/border colour (overrides `tier`). */
  ring?: string;
}

/**
 * Renders the weapon's icon composited over its rarity backdrop. Falls back to a
 * framed blade-glyph placeholder when there's no art or the image fails to load
 * (so a missing/mis-named file degrades gracefully instead of showing broken art).
 * Art paths are resolved by name in src/data/weaponIcons.ts (`iconFor`).
 */
export function WeaponIcon({ src, alt, size = 64, tier, frame, ring }: WeaponIconProps) {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [src]);

  const showImage = Boolean(src) && !errored;
  const backdrop = showImage ? frame ?? (tier ? TIER_FRAMES[tier] : undefined) : undefined;
  const border = ring ?? (tier ? TIER_STYLES[tier].bar : undefined);

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded ${
        backdrop ? "" : "frame bg-night-900"
      }`}
      style={{
        width: size,
        height: size,
        ...(!backdrop && border ? { borderColor: border, boxShadow: `0 0 0 1px ${border}55` } : {}),
      }}
    >
      {backdrop && (
        <Image src={asset(backdrop)} alt="" aria-hidden fill sizes={`${size}px`} className="scale-[1.35] object-cover" />
      )}
      {showImage ? (
        <Image
          src={asset(src as string)}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-contain p-[18%]"
          onError={() => setErrored(true)}
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
