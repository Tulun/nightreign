import Image from "next/image";

interface ShieldIconProps {
  src?: string;
  alt: string;
  /** Pixel size of the square. Defaults to 56. */
  size?: number;
}

/**
 * Renders a greatshield's icon if `src` is set, otherwise a framed placeholder
 * with a shield glyph. Drop square images in /public/icons/greatshields/ and
 * set an entry's `icon` in src/data/greatshields.ts to replace the placeholder.
 */
export function ShieldIcon({ src, alt, size = 56 }: ShieldIconProps) {
  return (
    <div
      className="frame relative grid shrink-0 place-items-center overflow-hidden rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-contain p-1.5" />
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
