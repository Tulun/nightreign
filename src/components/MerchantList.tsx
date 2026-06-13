import type { MerchantItem } from "@/lib/types";

export function MerchantList({ items }: { items: MerchantItem[] }) {
  if (items.length === 0) {
    return (
      <div className="frame rounded-lg bg-night-850 px-6 py-12 text-center">
        <p className="font-display text-parchment-muted">No wares recorded yet</p>
        <p className="mt-1 font-body text-sm text-parchment-faint">
          Add this seed&apos;s merchant items in{" "}
          <code className="text-gold-dim">src/data/seeds.ts</code>.
        </p>
      </div>
    );
  }

  return (
    <ul className="frame divide-y divide-night-600 overflow-hidden rounded-lg bg-night-850">
      {items.map((item, i) => (
        <li
          key={`${item.name}-${i}`}
          className="flex items-start justify-between gap-4 px-5 py-4"
        >
          <div className="min-w-0">
            <p className="font-display text-parchment">{item.name}</p>
            {item.effect && (
              <p className="mt-0.5 font-body text-sm text-parchment-muted">
                {item.effect}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {item.category && (
              <span className="eyebrow text-[0.6rem]">{item.category}</span>
            )}
            {item.cost !== undefined && (
              <span className="font-body text-gold-bright">
                {item.cost.toLocaleString()}
                <span className="ml-1 text-xs text-parchment-faint">runes</span>
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
