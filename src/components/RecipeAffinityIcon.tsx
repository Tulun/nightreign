"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { asset } from "@/lib/assets";

interface RecipeAffinityIconProps {
  src: string;
  alt: string;
  size?: number;
  /** Split icons may not exist yet — keep a placeholder frame so the row holds. */
  split?: boolean;
}

/**
 * A single recipe-slot icon. Pure-affinity icons always exist; the combined
 * split icon falls back to a dashed frame (instead of a broken image or a
 * collapsed row) until its PNG is dropped into /icons/elements/split.
 */
export function RecipeAffinityIcon({ src, alt, size = 22, split }: RecipeAffinityIconProps) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [src]);

  if (!ok) {
    return (
      <span
        className="inline-grid shrink-0 place-items-center rounded border border-dashed border-night-600 bg-night-900/60 text-[0.6rem] text-night-500"
        style={{ width: size, height: size }}
        title={`${alt} (icon missing)`}
        aria-label={`${alt} (icon missing)`}
      >
        ?
      </span>
    );
  }

  return (
    <Image
      src={asset(src)}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded object-contain"
      style={{ width: size, height: size }}
      onError={() => split && setOk(false)}
    />
  );
}
