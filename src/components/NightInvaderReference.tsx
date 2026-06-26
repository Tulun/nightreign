import { nightInvaderDrops } from "@/data/nightInvaders";
import { passiveBoost, passivePurpleEffect } from "@/lib/passiveBoost";

/**
 * Drop-specific weapon passives each Night Invader can drop, grouped by
 * Nightfarer. Night Invaders drop the epic (purple) tier, so each passive
 * shows that single value. Within a block, percent passives are listed first,
 * then the longer description ones.
 */
export function NightInvaderReference() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nightInvaderDrops.map((d) => {
        const resolved = d.passives.map((name) => ({ name, pct: passiveBoost(name, "purple") }));
        const withPct = resolved.filter((p) => p.pct);
        const flat = resolved.filter((p) => !p.pct);
        return (
          <section key={d.nightfarer} className="frame rounded-lg bg-night-800/60 p-4">
            <h3 className="font-display text-xl font-semibold text-gold-bright">{d.nightfarer}</h3>
            <ul className="mt-3 space-y-1.5">
              {withPct.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-2">
                  <span className="font-body text-base text-parchment">{p.name}</span>
                  <span className="shrink-0 font-body text-base font-semibold text-gold-dim">{p.pct}</span>
                </li>
              ))}
            </ul>
            {flat.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-night-700 pt-3">
                {flat.map((p) => (
                  <li key={p.name}>
                    <p className="font-body text-base text-parchment">{p.name}</p>
                    <p className="font-body text-sm text-parchment-muted">{passivePurpleEffect(p.name)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
