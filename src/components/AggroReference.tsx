import {
  dmgLevels,
  flatModifiers,
  distanceAggro,
  offTargetMultipliers,
  AGGRO_CREDIT,
  AGGRO_SOURCE_URL,
} from "@/data/aggro";

/** How enemies pick their target: aggro values per attack tier, flat modifiers, and switching rules. */
export function AggroReference() {
  return (
    <div className="space-y-10">
      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">Aggro per hit, by stagger tier</h3>
        <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
          Every attack has a hidden <code className="text-parchment">dmgLevel</code> — the
          stagger tier it inflicts. Aggro comes from that tier, not from damage
          dealt: a dagger poke and a dagger crit generate the same aggro. The
          enemy always targets whoever holds the highest total.
        </p>
        <div className="frame overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-left font-body text-base">
            <thead>
              <tr className="text-parchment-faint">
                <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">dmgLevel</th>
                <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Stagger</th>
                <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 text-right font-semibold">Aggro</th>
                <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Typical attacks</th>
              </tr>
            </thead>
            <tbody>
              {dmgLevels.map((row) => (
                <tr key={row.level} className="border-b border-night-800/70 hover:bg-night-800/60">
                  <td className="px-3 py-2.5 tabular-nums text-parchment-muted">{row.level}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-display font-semibold text-parchment">
                    {row.stagger}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${aggroTone(row.aggro)}`}>
                    {row.aggro}
                  </td>
                  <td className="px-3 py-2.5 text-parchment-muted">{row.examples ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">Flat modifiers</h3>
        <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
          These add to or subtract from your existing aggro directly — they are
          not multiplied.
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {flatModifiers.map((m) => (
            <div key={m.name} className="frame rounded-lg bg-night-800 p-4">
              <p className="font-display text-base font-semibold text-parchment">{m.name}</p>
              <p className={`mt-1 font-body text-lg font-semibold tabular-nums ${m.amount.startsWith("−") ? "text-emerald-300" : "text-red-300"}`}>
                {m.amount}
              </p>
              {m.note && <p className="mt-1 font-body text-base text-parchment-faint">{m.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">Proximity</h3>
        <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
          Simply standing near an enemy adds a small flat amount of aggro.
        </p>
        <div className="grid max-w-md grid-cols-3 gap-3">
          {distanceAggro.map((d) => (
            <div key={d.range} className="frame rounded-lg bg-night-800 p-4 text-center">
              <p className="font-body text-base text-parchment-faint">{d.range}</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-parchment">{d.aggro}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">The off-target multiplier</h3>
        <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
          The longer an enemy stays locked on one Nightfarer, the more aggro it
          takes from the other two — so off-target players inevitably pull
          attention, whatever they swing.
        </p>
        <div className="grid max-w-md grid-cols-3 gap-3">
          {offTargetMultipliers.map((m) => (
            <div key={m.after} className="frame rounded-lg bg-night-800 p-4 text-center">
              <p className="font-body text-base text-parchment-faint">{m.after}</p>
              <p className="mt-1 font-display text-xl font-bold text-gold-bright">{m.multiplier}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 font-body text-base text-parchment-muted">
          <li>
            When an enemy switches targets, the new target gets a flat{" "}
            <span className="font-semibold text-parchment">+3000 aggro for 5 seconds</span>{" "}
            on top of anything they generate — this stops enemies flip-flopping
            between players every swing.
          </li>
          <li>
            Aggro <span className="font-semibold text-parchment">decays to 0 over 10 seconds</span>,
            refreshed by each new attack.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">Worked examples</h3>
        <ul className="max-w-prose list-disc space-y-2 pl-5 font-body text-base text-parchment-muted">
          <li>
            A greatbow hit generates <span className="font-semibold text-parchment">1000 aggro</span>;
            off-target that becomes 2000/4000/10000. Rain of Arrows is higher still.
          </li>
          <li>
            Ironeye&rsquo;s basic bow shot is 100 aggro — but 200/400/1000 once
            the off-target multiplier kicks in. Rapid multi-hit attacks
            (powerstanced curved-sword jump attacks, each star of Stars of Ruin)
            stack the same way, which is why sustained off-target fire rips
            aggro regardless of dmgLevel.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="eyebrow mb-3 text-gold-bright">In practice</h3>
        <ul className="max-w-prose list-disc space-y-2 pl-5 font-body text-base text-parchment-muted">
          <li>
            Quick field test for a weapon&rsquo;s aggro tier: if an attack
            staggers <span className="font-semibold text-parchment">Leonine Misbegotten</span>,
            it has the highest melee aggro draw. If it staggers{" "}
            <span className="font-semibold text-parchment">Banished Knights</span> but not
            Leonine, it&rsquo;s the middle tier. If it only staggers small mobs,
            it&rsquo;s the lowest.
          </li>
          <li>
            Damage dealt has <span className="font-semibold text-parchment">nothing</span> to
            do with aggro — only stagger tier, hit count, and the modifiers above.
          </li>
          <li>
            &ldquo;Holding&rdquo; aggro long-term is usually unfeasible unless
            teammates stack heavy &ldquo;Less Likely to be Targeted&rdquo;
            penalties — past 11 seconds the off-target multiplier overwhelms a
            dedicated tank even if teammates do nothing.
          </li>
          <li>
            Best tanking tech: guard with a shockwave-on-guard shield (a
            shockwave is dmgLevel 3, worth 400 aggro) plus Draw Aggression
            (+350 per guard). Shield-poking Guardian with Draw Aggression is
            similarly potent.
          </li>
        </ul>
      </section>

      <p className="font-body text-sm text-parchment-faint">
        {AGGRO_CREDIT}{" "}
        <a
          href={AGGRO_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-gold"
        >
          Original post
        </a>
      </p>
    </div>
  );
}

/** Color-code aggro amounts so the dangerous tiers pop. */
function aggroTone(aggro: number) {
  if (aggro >= 1000) return "text-red-300";
  if (aggro >= 400) return "text-gold-bright";
  return "text-parchment-muted";
}
