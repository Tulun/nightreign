"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { asset } from "@/lib/assets";

/**
 * Spell icon framed like the in-game spell slot. Falls back to a small rune
 * glyph if the icon file is missing, so the grid never shows a broken image.
 */
export function SpellIcon({ src, alt, size = 64 }: { src?: string | null; alt: string; size?: number }) {
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
          className="object-contain p-1"
          onError={() => setErrored(true)}
        />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-1/2 w-1/2 text-gold-faint" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.6 6.3L21 9l-5 4.2L17.5 20 12 16.5 6.5 20 8 13.2 3 9l6.4-.7L12 2z" />
        </svg>
      )}
    </div>
  );
}
