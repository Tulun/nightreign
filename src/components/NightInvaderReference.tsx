import { nightInvaderDrops } from "@/data/nightInvaders";

/**
 * Drop-specific passives each Night Invader can drop, grouped by Nightfarer.
 */
export function NightInvaderReference() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nightInvaderDrops.map((d) => (
        <section
          key={d.nightfarer}
          className="frame rounded-lg bg-night-800/60 p-4"
        >
          <h3 className="font-display text-lg font-semibold text-gold-bright">{d.nightfarer}</h3>
          {d.passives.length === 0 ? (
            <p className="mt-2 font-body text-sm italic text-parchment-faint">
              {d.note ?? "No drops recorded"}
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {d.passives.map((p, i) => (
                <li
                  key={`${d.nightfarer}-${i}`}
                  className="font-body text-sm text-parchment-muted"
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
