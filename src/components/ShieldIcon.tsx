"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ShieldIconProps {
  src?: string;
  alt: string;
  /** Pixel size of the square. Defaults to 56. */
  size?: number;
}

/**
 * Renders a greatshield's icon if `src` is set and loads, otherwise a framed
 * placeholder with a shield glyph. Callers derive `src` from the shield id
 * (/icons/greatshields/<id>.png); a missing file fails to load and falls back
 * to the glyph rather than showing a broken image.
 */
export function ShieldIcon({ src, alt, size = 56 }: ShieldIconProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error flag when the src changes (e.g. the modal reused for a
  // different shield).
  useEffect(() => setErrored(false), [src]);

  const showImage = Boolean(src) && !errored;

  return (
    <div
      className="frame relative grid shrink-0 place-items-center overflow-hidden rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-contain p-1.5"
          onError={() => setErrored(true)}
        />
      ) : (
        <ShieldGlyph />
      )}
    </div>
  );
}

function ShieldGlyph() {
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
      <path d="M12 3l7 2.5v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V5.5L12 3z" />
    </svg>
  );
}
