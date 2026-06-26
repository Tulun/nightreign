import Link from "next/link";
import { notFound } from "next/navigation";
import { getSet, sets } from "@/data/sets";
import { getSetSignature } from "@/lib/types";
import { iconFor } from "@/data/weaponIcons";
import { passiveBoost } from "@/lib/passiveBoost";
import { HIGHLIGHT_COLOR } from "@/lib/tiers";
import { WeaponIcon } from "@/components/WeaponIcon";
import { MerchantSection } from "@/components/MerchantSection";

// Pre-render a static page for every set at build time.
export function generateStaticParams() {
  return sets.map((s) => ({ setId: String(s.id) }));
}

export default function SetDetailPage({
  params,
}: {
  params: { setId: string };
}) {
  const id = Number(params.setId);
  const set = Number.isInteger(id) ? getSet(id) : undefined;

  if (!set) notFound();

  const sig = getSetSignature(set);
  const sigColor = sig?.highlighted ? HIGHLIGHT_COLOR : undefined;
  const sigBoost = sig ? passiveBoost(sig.passive, sig.tier) : null;
  const label = String(set.id).padStart(2, "0");

  return (
    <div>
      <Link
        href="/town-map"
        className="inline-flex items-center gap-1.5 font-body text-sm text-parchment-muted transition-colors hover:text-gold"
      >
        <span aria-hidden="true">←</span> All sets
      </Link>

      {/* Set signature (last Normal Merchant item) */}
      <header className="mt-5 flex items-center gap-5 border-b border-night-600 pb-7">
        <WeaponIcon src={iconFor(sig)} alt={sig?.name ?? "Unrecorded"} size={88} tier={sig?.tier} />
        <div className="min-w-0">
          <p className="eyebrow">Set {label} · Signature weapon</p>
          <h2
            className="mt-1 font-display text-3xl font-bold text-parchment"
            style={sigColor ? { color: sigColor } : undefined}
          >
            {sig?.name ?? "Not yet recorded"}
          </h2>
          {sig && (
            <p
              className="mt-1 font-body text-lg uppercase tracking-[0.04em] text-parchment-muted"
              style={sigColor ? { color: sigColor } : undefined}
            >
              {sig.passive}
              {sigBoost && <span className="ml-2 font-semibold text-gold-bright">{sigBoost}</span>}
            </p>
          )}
        </div>
      </header>

      <div className="mt-8 space-y-8">
        <MerchantSection title="Special Merchant" items={set.specialMerchant} />
        <MerchantSection title="Normal Merchant" items={set.normalMerchant} />
      </div>
    </div>
  );
}
