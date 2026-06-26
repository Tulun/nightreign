import { nightInvaderDrops } from "@/data/nightInvaders";
import { passiveBoost, passivePurpleEffect } from "@/lib/passiveBoost";

/**
 * Drop-specific weapon passives each Night Invader can drop, grouped by
 * Nightfarer. Night Invaders drop the epic (purple) tier, so each passive
 * shows that single value.
 */
export function NightInvaderReference() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nightInvaderDrops.map((d) => (
        <section key={d.nightfarer} className="frame rounded-lg bg-night-800/60 p-4">
          <h3 className="font-display text-lg font-semibold text-gold-bright">{d.nightfarer}</h3>
          <ul className="mt-2 space-y-2">
            {d.passives.map((name, i) => {
              const pct = passiveBoost(name, "purple");
              return (
                <li key={`${d.nightfarer}-${i}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-body text-sm text-parchment">{name}</span>
                    {pct && <span className="shrink-0 font-body text-sm font-semibold text-gold-dim">{pct}</span>}
                  </div>
                  {!pct && (
                    <p className="font-body text-xs text-parchment-muted">{passivePurpleEffect(name)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
