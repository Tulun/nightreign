import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeed, seeds } from "@/data/seeds";
import { WeaponIcon } from "@/components/WeaponIcon";
import { MerchantList } from "@/components/MerchantList";

// Pre-render a static page for every seed at build time.
export function generateStaticParams() {
  return seeds.map((s) => ({ seedId: String(s.id) }));
}

export default function SeedDetailPage({
  params,
}: {
  params: { seedId: string };
}) {
  const id = Number(params.seedId);
  const seed = Number.isInteger(id) ? getSeed(id) : undefined;

  if (!seed) notFound();

  return (
    <div>
      <Link
        href="/town-map"
        className="inline-flex items-center gap-1.5 font-body text-sm text-parchment-muted transition-colors hover:text-gold"
      >
        <span aria-hidden="true">←</span> All seeds
      </Link>

      {/* Weapon header */}
      <header className="mt-5 flex items-center gap-5 border-b border-night-600 pb-7">
        <WeaponIcon src={seed.weapon.icon} alt={seed.weapon.name} size={88} />
        <div className="min-w-0">
          <p className="eyebrow">
            Seed {String(seed.id).padStart(2, "0")} · Weapon
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-parchment">
            {seed.weapon.name}
          </h2>
          <p className="mt-1 font-body text-lg text-gold-bright/90">
            {seed.weapon.passive}
          </p>
        </div>
      </header>

      {/* Merchant wares */}
      <section className="mt-8">
        <h3 className="eyebrow mb-3">Town Merchant</h3>
        <MerchantList items={seed.merchantItems} />
      </section>
    </div>
  );
}
