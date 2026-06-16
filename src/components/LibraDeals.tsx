import { libraDeals, LIBRA_CREDIT, ITEM_INFO } from "@/data/libra";
import { DEAL_CATEGORIES, type ItemInfo, type LibraDeal } from "@/lib/libra";

const ITEM_NAMES = Object.keys(ITEM_INFO);

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
          <dd className="font-body text-sm text-parchment">{withItemTooltips(deal.effect)}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="mt-0.5 w-12 shrink-0 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-red-300/80">
            Cost
          </dt>
          <dd className="font-body text-sm text-parchment-muted">{deal.cost}</dd>
        </div>
      </dl>

      {deal.weapons && (
        <div className="mt-3 border-t border-night-700 pt-3">
          <p className="mb-1.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
            Possible weapons
          </p>
          <div className="flex flex-wrap gap-1.5">
            {deal.weapons.map((w) => {
              const info = ITEM_INFO[w];
              const chip = (
                <span className="cursor-help rounded border border-night-600 bg-night-900 px-2 py-0.5 font-body text-xs text-parchment transition-colors hover:border-gold-faint">
                  {w}
                </span>
              );
              return info ? (
                <Tooltip key={w} info={info}>{chip}</Tooltip>
              ) : (
                <span key={w}>{chip}</span>
              );
            })}
          </div>
        </div>
      )}

      {deal.note && (
        <p className="mt-2 font-body text-xs italic text-parchment-faint">{deal.note}</p>
      )}
    </div>
  );
}

/** Wrap any known item name found in the text with a hover tooltip. */
function withItemTooltips(text: string) {
  if (ITEM_NAMES.length === 0) return text;
  const escaped = ITEM_NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(re).map((seg, i) =>
    ITEM_INFO[seg] ? (
      <Tooltip key={i} info={ITEM_INFO[seg]}>
        <span className="cursor-help underline decoration-dotted decoration-gold underline-offset-2">
          {seg}
        </span>
      </Tooltip>
    ) : (
      <span key={i}>{seg}</span>
    ),
  );
}

/** CSS-only hover tooltip showing a structured item card (with `title` fallback). */
function Tooltip({ info, children }: { info: ItemInfo; children: React.ReactNode }) {
  return (
    <span className="group relative inline-block align-middle" title={flattenInfo(info)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-64 max-w-[80vw] -translate-x-1/2 rounded-md border border-night-600 bg-night-950 px-3 py-2 text-left font-body text-xs normal-case not-italic text-parchment-muted shadow-2xl group-hover:block">
        <span className="block font-display text-[0.7rem] font-semibold uppercase tracking-wide text-gold-bright">
          {info.type}
        </span>
        {info.skill && <InfoLine label="Skill" value={info.skill} />}
        {info.scaling && <InfoLine label="Scaling" value={info.scaling} />}
        {info.notable && <InfoLine label="Stats" value={info.notable} />}
        {info.status && <InfoLine label="Status" value={info.status} />}
        {info.note && <span className="mt-1 block italic text-parchment-faint">{info.note}</span>}
      </span>
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <span className="mt-0.5 block">
      <span className="text-parchment-faint">{label}: </span>
      {value}
    </span>
  );
}

function flattenInfo(info: ItemInfo): string {
  return [info.type, info.skill, info.scaling, info.notable, info.status, info.note]
    .filter(Boolean)
    .join(" · ");
}
