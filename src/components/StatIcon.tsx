"use client";

import Image from "next/image";
import { useState } from "react";
import { asset } from "@/lib/assets";

/**
 * A small inline icon (element affinity or status effect) that quietly hides
 * itself if the image file is missing, so chips fall back to text-only.
 */
export function StatIcon({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <Image
      src={asset(src)}
      alt={alt}
      width={size}
      height={size}
      className="inline-block h-4 w-4 shrink-0 object-contain"
      onError={() => setOk(false)}
    />
  );
}
