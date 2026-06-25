import Link from "next/link";
import type { MerchantSet } from "@/lib/types";
import { getSetSignature } from "@/lib/types";
import { iconFor } from "@/data/weaponIcons";
import { TIER_STYLES, HIGHLIGHT_COLOR } from "@/lib/tiers";
import { WeaponIcon } from "./WeaponIcon";

/**
 * Grid card for a set. Its icon + label come from the set's signature weapon
 * (the last Normal Merchant item). Links to the set's detail view.
 */
export function SetCard({ set }: { set: MerchantSet }) {
  const sig = getSetSignature(set);
  const tier = sig ? TIER_STYLES[sig.tier] : undefined;
  const nameColor = sig?.highlighted ? HIGHLIGHT_COLOR : undefined;
  const label = String(set.id).padStart(2, "0");

  return (
    <Link
      href={`/town-map/${set.id}`}
      className="frame group relative flex items-center gap-4 rounded-lg bg-night-800 p-4 shadow-seal transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
      style={tier ? { borderLeftColor: tier.bar, borderLeftWidth: 3 } : undefined}
    >
      <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-gold-faint bg-night-950 font-display text-xs font-semibold text-gold">
        {label}
      </span>

      <WeaponIcon src={iconFor(sig)} alt={sig?.name ?? "Unrecorded set"} tier={sig?.tier} />

      <div className="min-w-0 flex-1">
        <p className="eyebrow">Set {label}</p>
        {sig ? (
          <>
            <h3
              className="truncate font-display text-lg font-semibold text-parchment"
              style={nameColor ? { color: nameColor } : undefined}
            >
              {sig.name}
            </h3>
            <p
              className="mt-0.5 truncate font-body text-[0.95rem] uppercase tracking-[0.03em] text-parchment-muted"
              style={nameColor ? { color: nameColor } : undefined}
            >
              {sig.passive}
            </p>
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
