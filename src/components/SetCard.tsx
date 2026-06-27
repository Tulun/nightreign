import Link from "next/link";
import type { MerchantSet } from "@/lib/types";
import { getSetSignature, SHOP_RARITY, weaponForm } from "@/lib/types";
import { withPassiveValue } from "@/lib/passiveBoost";
import { iconFor } from "@/data/weaponIcons";
import { WeaponIcon } from "./WeaponIcon";

/**
 * Grid card for a seed. Its icon + label come from the seed's signature weapon
 * (its Purple Normal-merchant weapon), shown in its normal or Deep of Night form.
 */
export function SetCard({ set, deepOfNight = false }: { set: MerchantSet; deepOfNight?: boolean }) {
  const base = getSetSignature(set, deepOfNight);
  const sig = base ? weaponForm(base, deepOfNight) : undefined;
  const meta = sig ? SHOP_RARITY[sig.rarity] : undefined;
  const label = String(set.id).padStart(2, "0");

  return (
    <Link
      href={`/town-map/${set.id}`}
      className="frame group relative flex items-center gap-4 rounded-lg bg-night-800 p-4 shadow-seal transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
      style={meta ? { borderLeftColor: meta.color, borderLeftWidth: 3 } : undefined}
    >
      <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-gold-faint bg-night-950 font-display text-xs font-semibold text-gold">
        {label}
      </span>

      <WeaponIcon
        src={iconFor(sig)}
        alt={sig?.name ?? "Unrecorded seed"}
        size={80}
        frame={meta?.frame}
        ring={meta?.color}
      />

      <div className="min-w-0 flex-1">
        <p className="eyebrow">Set {label}</p>
        {sig ? (
          <>
            <h3 className="truncate font-display text-lg font-semibold" style={{ color: meta?.color }}>
              {sig.name}
            </h3>
            {sig.passives[0] && (
              <p className="mt-0.5 truncate font-body text-[0.95rem] uppercase tracking-[0.03em] text-parchment-muted">
                {withPassiveValue(sig.passives[0], sig.rarity)}
              </p>
            )}
          </>
        ) : (
          <h3 className="font-display text-lg font-semibold italic text-parchment-faint">
            Not yet recorded
          </h3>
        )}
      </div>

      <span
        aria-hidden="true"
        className="self-center text-parchment-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gold"
      >
        →
      </span>
    </Link>
  );
}
