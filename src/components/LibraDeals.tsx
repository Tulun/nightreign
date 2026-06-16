import { libraDeals, LIBRA_CREDIT } from "@/data/libra";
import { DEAL_CATEGORIES, type LibraDeal } from "@/lib/libra";

/** Libra deals grouped by category, each showing its effect and cost. */
export function LibraDeals() {
  return (
    <div>
      <div className="space-y-8">
        {DEAL_CATEGORIES.map((cat) => {
          const deals = libraDeals.filter((d) => d.category === cat);
          if (deals.length === 0) return null;
          return (
            <section key={cat}>
              <h3 className="eyebrow mb-3 text-gold-bright">{cat}</h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">{LIBRA_CREDIT}</p>
    </div>
  );
}

function DealCard({ deal }: { deal: LibraDeal }) {
  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <p className="font-display text-base font-semibold italic text-parchment">
        &ldquo;{deal.prompt}&rdquo;
        {deal.statSwap && (
          <span className="ml-2 rounded border border-gold-faint px-1.5 py-0.5 align-middle text-[0.55rem] font-semibold uppercase not-italic tracking-wide text-gold">
            Stat swap
          </span>
        )}
      </p>
      <dl className="mt-3 space-y-2">
        <div className="flex items-start gap-2">
          <dt className="mt-0.5 w-12 shrink-0 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-300/80">
            Effect
          </dt>
          <dd className="font-body text-sm text-parchment">{deal.effect}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="mt-0.5 w-12 shrink-0 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-red-300/80">
            Cost
          </dt>
          <dd className="font-body text-sm text-parchment-muted">{deal.cost}</dd>
        </div>
      </dl>
    </div>
  );
}
