import Link from "next/link";
import type { Seed } from "@/lib/types";
import { WeaponIcon } from "./WeaponIcon";

export function SeedCard({ seed }: { seed: Seed }) {
  const recorded = seed.weapon.name !== "Unrecorded";

  return (
    <Link
      href={`/town-map/${seed.id}`}
      className="frame group relative flex items-center gap-4 rounded-lg bg-night-800 p-4 shadow-seal transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
    >
      {/* Seal number — the seeds are a real numbered set, so the marker means something. */}
      <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-gold-faint bg-night-950 font-display text-xs font-semibold text-gold">
        {seed.id}
      </span>

      {/* Weapon icon */}
      <WeaponIcon src={seed.weapon.icon} alt={seed.weapon.name} />

      {/* Info div beside the icon */}
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Weapon</p>
        <h3
          className={`truncate font-display text-lg font-semibold ${
            recorded ? "text-parchment" : "text-parchment-faint italic"
          }`}
        >
          {seed.weapon.name}
        </h3>
        <p className="mt-0.5 truncate font-body text-gold-bright/90">
          {seed.weapon.passive}
        </p>
      </div>

      {/* Affordance: this card leads somewhere */}
      <span
        aria-hidden="true"
        className="self-center text-parchment-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gold"
      >
        →
      </span>
    </Link>
  );
}
