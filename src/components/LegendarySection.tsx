import type { LegendaryItem } from "@/lib/types";
import { withPassiveValue } from "@/lib/passiveBoost";
import { iconFor } from "@/data/weaponIcons";
import { WeaponIcon } from "./WeaponIcon";

const GOLD = "#d9b25b";
const FRAME = "/icons/weapons/backgrounds/yellow.png";

/** The Great Hollow Legendary merchant — rarer stock, shared across a seed group. */
export function LegendarySection({ items }: { items: LegendaryItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="eyebrow mb-1">Legendary Merchant</h3>
      <p className="mb-3 font-body text-xs text-parchment-faint">Great Hollow only — a rarer occurrence.</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={`${it.name}-${i}`}
            className="frame flex gap-3 rounded-md border-l-[3px] px-3 py-2.5"
            style={{ borderLeftColor: GOLD, background: `${GOLD}12` }}
          >
            <WeaponIcon src={it.icon ?? iconFor({ name: it.name })} alt={it.name} size={48} frame={FRAME} ring={GOLD} />
            <div className="min-w-0 flex-1">
              <span className="font-display text-base font-semibold leading-tight" style={{ color: GOLD }}>
                {it.name}
              </span>
              <p className="mt-1 font-body text-sm leading-snug text-parchment-muted">{withPassiveValue(it.passive, "Red")}</p>
              {it.spell && (
                <p className="mt-0.5 font-body text-xs text-parchment-faint">
                  <span className="text-parchment-faint">Spell: </span>
                  {it.spell}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
