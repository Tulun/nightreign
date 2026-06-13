import type { WeaponEntry } from "@/lib/types";
import { TIER_STYLES, HIGHLIGHT_COLOR } from "@/lib/tiers";

/** A labelled list of weapon entries (one merchant's inventory). */
export function MerchantSection({
  title,
  items,
}: {
  title: string;
  items: WeaponEntry[];
}) {
  return (
    <section>
      <h3 className="eyebrow mb-3">{title}</h3>
      {items.length === 0 ? (
        <div className="frame rounded-lg bg-night-850 px-6 py-10 text-center">
          <p className="font-display text-parchment-muted">Not recorded yet</p>
          <p className="mt-1 font-body text-sm text-parchment-faint">
            Add this set&apos;s items in{" "}
            <code className="text-gold-dim">src/data/sets.ts</code>.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <MerchantRow key={`${item.name}-${i}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MerchantRow({ item }: { item: WeaponEntry }) {
  const tier = TIER_STYLES[item.tier];
  const textColor = item.highlighted ? HIGHLIGHT_COLOR : undefined;

  return (
    <li
      className="frame flex flex-col gap-1 rounded-md border-l-[3px] px-4 py-3 sm:flex-row sm:items-center sm:gap-5"
      style={{ borderLeftColor: tier.bar, background: tier.bg }}
    >
      <span
        className="font-display text-base font-semibold leading-tight text-parchment sm:basis-64 sm:shrink-0"
        style={textColor ? { color: textColor } : undefined}
      >
        {item.name}
      </span>
      <span
        className="font-body text-lg font-medium uppercase leading-snug tracking-[0.04em] text-parchment"
        style={textColor ? { color: textColor } : undefined}
      >
        {item.passive}
      </span>
    </li>
  );
}
