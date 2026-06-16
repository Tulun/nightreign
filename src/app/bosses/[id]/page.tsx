import Link from "next/link";
import { notFound } from "next/navigation";
import { BossDetailView } from "@/components/BossDetailView";
import { bosses } from "@/data/bosses";
import { BOSS_CATEGORIES } from "@/lib/bosses";

export function generateStaticParams() {
  return bosses.map((b) => ({ id: b.id }));
}

export default function BossPage({ params }: { params: { id: string } }) {
  const boss = bosses.find((b) => b.id === params.id);
  if (!boss) notFound();

  const tabLabels = boss.categories
    .map((c) => BOSS_CATEGORIES.find((bc) => bc.key === c)?.label)
    .filter(Boolean);

  return (
    <div>
      <Link
        href="/bosses"
        className="inline-flex items-center gap-1.5 font-body text-sm text-parchment-muted transition-colors hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Boss Codex
      </Link>

      <header className="mb-8 mt-3 border-b border-night-600 pb-6">
        <p className="eyebrow">{tabLabels.join(" · ")}</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">{boss.name}</h2>
      </header>

      <BossDetailView boss={boss} />
    </div>
  );
}
