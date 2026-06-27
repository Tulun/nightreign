import Link from "next/link";
import { notFound } from "next/navigation";
import { getSet, sets } from "@/data/sets";
import { getSetSignature, SHOP_RARITY } from "@/lib/types";
import { iconFor } from "@/data/weaponIcons";
import { WeaponIcon } from "@/components/WeaponIcon";
import { SeedShop } from "@/components/SeedShop";

// Pre-render a static page for every seed at build time.
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
  const meta = sig ? SHOP_RARITY[sig.rarity] : undefined;
  const label = String(set.id).padStart(2, "0");

  return (
    <div>
      <Link
        href="/town-map"
        className="inline-flex items-center gap-1.5 font-body text-sm text-parchment-muted transition-colors hover:text-gold"
      >
        <span aria-hidden="true">←</span> All seeds
      </Link>

      {/* Set signature (its Purple weapon) */}
      <header className="mt-5 flex items-center gap-5 border-b border-night-600 pb-7">
        <WeaponIcon src={iconFor(sig)} alt={sig?.name ?? "Unrecorded"} size={88} frame={meta?.frame} ring={meta?.color} />
        <div className="min-w-0">
          <p className="eyebrow">Set {label} · Signature weapon</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-parchment" style={{ color: meta?.color }}>
            {sig?.name ?? "Not yet recorded"}
          </h2>
          {sig?.passives[0] && (
            <p className="mt-1 font-body text-lg uppercase tracking-[0.04em] text-parchment-muted">
              {sig.passives[0]}
            </p>
          )}
        </div>
      </header>

      <div className="mt-8">
        <SeedShop set={set} />
      </div>
    </div>
  );
}
