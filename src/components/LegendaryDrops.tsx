import { legendaryWeapons, LEGENDARY_NOTE } from "@/data/fieldBosses";

/** Per-weapon odds that a Legendary drop is a given weapon. */
export function LegendaryDrops() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {legendaryWeapons.map((w) => {
          const cls =
            w.chance >= 5 ? "text-emerald-300" : w.chance >= 2 ? "text-gold-bright" : "text-red-300";
          return (
            <div
              key={w.name}
              className={`frame rounded-md bg-night-800 p-2.5 ${w.red ? "border-red-500/60" : ""}`}
            >
              <span className={`font-display text-base font-bold tabular-nums ${cls}`}>
                {w.chance}%
              </span>
              <p className="mt-0.5 font-body text-xs leading-tight text-parchment">{w.name}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-body text-xs text-parchment-faint">{LEGENDARY_NOTE}</p>
    </div>
  );
}
