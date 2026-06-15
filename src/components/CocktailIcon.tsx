"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { asset } from "@/lib/assets";

interface CocktailIconProps {
  src?: string;
  alt: string;
  size?: number;
}

/**
 * Cocktail icon if `src` loads, otherwise a framed flask glyph. Callers derive
 * `src` from the cocktail id (/icons/cocktails/<id>.png); a missing file falls
 * back to the glyph instead of a broken image.
 */
export function CocktailIcon({ src, alt, size = 56 }: CocktailIconProps) {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [src]);
  const showImage = Boolean(src) && !errored;

  return (
    <div
      className="frame relative grid shrink-0 place-items-center overflow-hidden rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={asset(src as string)}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-contain p-1.5"
          onError={() => setErrored(true)}
        />
      ) : (
        <FlaskGlyph />
      )}
    </div>
  );
}

function FlaskGlyph() {
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
      <path d="M9 3h6M10 3v5.5L5.3 16.5A2 2 0 0 0 7 19.5h10a2 2 0 0 0 1.7-3L14 8.5V3" />
      <path d="M7.5 14h9" />
    </svg>
  );
}
