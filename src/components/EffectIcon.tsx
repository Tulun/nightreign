import Image from "next/image";
import { asset } from "@/lib/assets";
import { EFFECT_ICON_LABELS, effectIcon } from "@/lib/effectIcon";

/**
 * The game's own glyph for an effect line — sword for attack power, armor for
 * negation, bag for items. Decorative: the effect text beside it already says
 * what it does, so it carries no alt text, only a tooltip.
 *
 * An effect we can't classify still reserves the space, so a list of lines
 * keeps one text margin and every row starts where the last one did. That
 * alignment is the point on narrow screens: it's what makes a wrapped
 * three-line effect read as one effect instead of three.
 */
export function EffectIcon({ name, size = 14 }: { name: string; size?: number }) {
  const icon = effectIcon(name);
  const box = { width: size, height: size };
  if (!icon) {
    return <span aria-hidden className="shrink-0" style={box} />;
  }
  return (
    <Image
      src={asset(`/icons/effects/${icon}.png`)}
      alt=""
      title={EFFECT_ICON_LABELS[icon]}
      width={size}
      height={size}
      aria-hidden
      className="mt-[0.15em] shrink-0 object-contain"
      style={box}
    />
  );
}
