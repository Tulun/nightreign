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
  // The glyph centres on the *first* line of the effect rather than the block:
  // a one-line-tall box (1lh follows whatever line-height the row inherits)
  // does that at any text size, so a wrapped three-line effect still shows its
  // icon beside the line it starts on instead of floating above it.
  const wrap = "flex h-[1lh] shrink-0 items-center";
  if (!icon) {
    return <span aria-hidden className={wrap} style={{ width: size }} />;
  }
  return (
    <span aria-hidden className={wrap} style={{ width: size }} title={EFFECT_ICON_LABELS[icon]}>
      <Image
        src={asset(`/icons/effects/${icon}.png`)}
        alt=""
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
