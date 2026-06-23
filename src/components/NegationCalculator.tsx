"use client";

import { useMemo, useState } from "react";
import { nightfarers } from "@/data/characters";
import {
  computeNegations,
  ELEMENTS,
  NEG_EFFECTS,
  NEG_EFFECT_MAP,
  NEG_LABELS,
  NEG_TYPES,
  scopeLabel,
  type AppliedNeg,
  type EffectSource,
  type NegEffect,
  type NegType,
} from "@/lib/negationCalc";

type Step = "character" | "buffs" | "results";
interface Inst { effectId: string; element?: NegType }
interface Relic { enabled: boolean; effects: Inst[]; curses: Inst[] }

const NEW_RELICS = (): Relic[] => Array.from({ length: 6 }, () => ({ enabled: false, effects: [], curses: [] }));

export function NegationCalculator() {
  const [step, setStep] = useState<Step>("character");
  const [charName, setCharName] = useState(nightfarers[0].name);
  const [relics, setRelics] = useState<Relic[]>(NEW_RELICS);
  const [weapons, setWeapons] = useState<Inst[]>([]);
  const [hit, setHit] = useState(1000);

  const character = nightfarers.find((c) => c.name === charName) ?? nightfarers[0];

  function patchRelic(i: number, fn: (r: Relic) => Relic) {
    setRelics((prev) => prev.map((r, idx) => (idx === i ? fn(r) : r)));
  }

  // Deduped active effects (one copy per rarity tier / element).
  const activeEffects = useMemo(() => {
    const seen = new Set<string>();
    const out: { eff: NegEffect; element?: NegType }[] = [];
    const add = (inst: Inst) => {
      const eff = inst.effectId ? NEG_EFFECT_MAP[inst.effectId] : undefined;
      if (!eff) return;
      const element = eff.needsElement ? inst.element ?? "magic" : undefined;
      const key = `${eff.id}:${element ?? ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ eff, element });
    };
    relics.forEach((r) => { if (r.enabled) { r.effects.forEach(add); r.curses.forEach(add); } });
    weapons.forEach(add);
    return out;
  }, [relics, weapons]);

  const applied: AppliedNeg[] = useMemo(
    () => activeEffects.map(({ eff, element }) => ({ scope: eff.scope, value: eff.value, element })),
    [activeEffects],
  );
  const final = useMemo(() => computeNegations(character.negations, applied), [character, applied]);

  return (
    <div>
      <Steps step={step} />

      {step === "character" && (
        <Section title="Character">
          <label className="mb-4 flex flex-col gap-1">
            <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">Nightfarer</span>
            <select value={charName} onChange={(e) => setCharName(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-display text-sm font-semibold text-parchment focus:border-gold-faint focus:outline-none">
              {nightfarers.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <p className="mb-2 font-body text-sm text-parchment-muted">Base negation at Lv15 — all damage types:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NEG_TYPES.map((t) => (
              <div key={t} className="flex items-center justify-between rounded-md border border-night-700 bg-night-900/60 px-3 py-2">
                <span className="font-body text-sm text-parchment-muted">{NEG_LABELS[t]}</span>
                <span className="font-display text-sm font-bold tabular-nums text-sky-300">{character.negations[t]}%</span>
              </div>
            ))}
          </div>
          <Nav onNext={() => setStep("buffs")} nextLabel="Next: Buffs →" />
        </Section>
      )}

      {step === "buffs" && (
        <div className="space-y-6">
          <Section title="Negation Relics">
            <p className="mb-3 rounded-lg border border-night-600 bg-night-800/60 px-4 py-2 font-body text-sm text-parchment-muted">
              Up to 6 relics, each holding stacking negation effects (one copy per rarity tier counts). Add a Curse
              penalty if your relic carries one.
            </p>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {relics.map((relic, i) => (
                <div key={i} className={`rounded-lg border p-3 ${relic.enabled ? "border-sky-500/50 bg-night-800" : "border-night-700 bg-night-900/40"}`}>
                  <button type="button" onClick={() => patchRelic(i, (r) => ({ ...r, enabled: !r.enabled, effects: !r.enabled && r.effects.length === 0 ? [{ effectId: "" }] : r.effects }))}
                    className="flex w-full items-center gap-2 font-display text-sm font-semibold text-parchment">
                    <span className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${relic.enabled ? "bg-sky-500" : "bg-night-600"}`}>
                      <span className={`h-3 w-3 rounded-full bg-night-950 transition-transform ${relic.enabled ? "translate-x-3" : ""}`} />
                    </span>
                    Relic {i + 1}
                  </button>

                  {relic.enabled && (
                    <div className="mt-2 space-y-1.5">
                      {relic.effects.map((inst, j) => (
                        <EffectRow key={`e${j}`} source="relic" inst={inst}
                          onChange={(v) => patchRelic(i, (r) => ({ ...r, effects: r.effects.map((e, k) => (k === j ? v : e)) }))}
                          onRemove={() => patchRelic(i, (r) => ({ ...r, effects: r.effects.filter((_, k) => k !== j) }))} />
                      ))}
                      {relic.curses.map((inst, j) => (
                        <EffectRow key={`c${j}`} source="curse" inst={inst} curse
                          onChange={(v) => patchRelic(i, (r) => ({ ...r, curses: r.curses.map((e, k) => (k === j ? v : e)) }))}
                          onRemove={() => patchRelic(i, (r) => ({ ...r, curses: r.curses.filter((_, k) => k !== j) }))} />
                      ))}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => patchRelic(i, (r) => ({ ...r, effects: [...r.effects, { effectId: "" }] }))}
                          className="flex-1 rounded border border-dashed border-night-600 px-2 py-1 font-body text-xs text-sky-300 hover:bg-night-700">+ Add Effect</button>
                        <button type="button" onClick={() => patchRelic(i, (r) => ({ ...r, curses: [...r.curses, { effectId: "" }] }))}
                          className="rounded border border-dashed border-red-500/40 px-2 py-1 font-body text-xs text-red-300 hover:bg-night-700">+ Curse Penalty</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Defensive Weapon Passives">
            <p className="mb-3 font-body text-sm text-parchment-muted">Add weapon passives that provide damage negation.</p>
            <div className="space-y-1.5">
              {weapons.map((inst, j) => (
                <EffectRow key={j} source="weapon" inst={inst}
                  onChange={(v) => setWeapons((w) => w.map((e, k) => (k === j ? v : e)))}
                  onRemove={() => setWeapons((w) => w.filter((_, k) => k !== j))} />
              ))}
            </div>
            <button type="button" onClick={() => setWeapons((w) => [...w, { effectId: "" }])}
              className="mt-2 w-full rounded border border-dashed border-night-600 px-2 py-1.5 font-body text-xs text-sky-300 hover:bg-night-700">+ Add Weapon Passive</button>
            <p className="mt-3 font-body text-[0.7rem] italic text-parchment-faint">Defensive talismans aren&rsquo;t a separate item type in this tool yet — their negation effects live under relics.</p>
          </Section>

          <Nav onBack={() => setStep("character")} onNext={() => setStep("results")} nextLabel="Calculate Negation" />
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <div className="frame rounded-lg bg-night-850 p-4 text-center">
            <p className="eyebrow text-sky-300">Negation Breakdown</p>
            <p className="mt-1 font-display text-2xl font-bold text-parchment">{character.name}</p>
          </div>

          <Section title="Negation by Damage Type">
            <p className="mb-3 font-body text-sm text-parchment-muted">Each source reduces the remaining damage multiplicatively — you can never reach 100%.</p>
            <label className="mb-3 flex items-center gap-2 font-body text-sm text-parchment-muted">
              Simulate hit value:
              <input type="number" value={hit} min={1} onChange={(e) => setHit(Math.max(1, Number(e.target.value) || 0))}
                className="w-24 rounded border border-night-600 bg-night-900 px-2 py-1 font-body text-sm text-parchment focus:border-gold-faint focus:outline-none" /> damage
            </label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-night-600 text-parchment-faint">
                    <th className="py-2 pr-3 font-semibold">Damage Type</th>
                    <th className="px-2 py-2 text-right font-semibold">Base (Lv15)</th>
                    <th className="px-2 py-2 text-right font-semibold">Effective Neg.</th>
                    <th className="px-2 py-2 text-right font-semibold">Dmg Taken</th>
                    <th className="px-2 py-2 text-right font-semibold">{hit.toLocaleString()} hit →</th>
                  </tr>
                </thead>
                <tbody>
                  {NEG_TYPES.map((t) => {
                    const f = final[t];
                    const mult = 1 - f / 100;
                    return (
                      <tr key={t} className="border-b border-night-800/70">
                        <td className="py-2 pr-3 font-display font-semibold text-parchment">{NEG_LABELS[t]}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-parchment-faint">{character.negations[t]}%</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-sky-300">{f.toFixed(1)}%</td>
                        <td className="px-2 py-2 text-right tabular-nums text-parchment-muted">×{mult.toFixed(3)}</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-gold-dim">~{Math.round(hit * mult)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Active Negation Buffs">
            {activeEffects.length === 0 ? (
              <p className="font-body text-sm text-parchment-faint">No effects selected — showing base negation only.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-night-600 text-parchment-faint">
                      <th className="py-2 pr-3 font-semibold">Effect</th>
                      <th className="px-2 py-2 font-semibold">Source</th>
                      <th className="px-2 py-2 font-semibold">Applies To</th>
                      <th className="px-2 py-2 font-semibold">Condition</th>
                      <th className="px-2 py-2 text-right font-semibold">Negation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEffects.map(({ eff, element }, i) => (
                      <tr key={i} className="border-b border-night-800/70">
                        <td className="py-2 pr-3 text-parchment">{eff.label.replace("[Element]", element ? NEG_LABELS[element] : "Element")}</td>
                        <td className="px-2 py-2 text-parchment-muted capitalize">{eff.source}</td>
                        <td className="px-2 py-2 text-parchment-muted">{scopeLabel(eff.scope, element)}</td>
                        <td className="px-2 py-2 text-parchment-muted">{eff.condition ?? "Always active"}</td>
                        <td className={`px-2 py-2 text-right font-semibold tabular-nums ${eff.value < 0 ? "text-red-300" : "text-sky-300"}`}>
                          {eff.value > 0 ? `+${eff.value}` : eff.value}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("buffs")} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700">← Edit Buffs</button>
            <button type="button" onClick={() => { setRelics(NEW_RELICS()); setWeapons([]); setStep("character"); }}
              className="rounded-lg border border-gold-faint bg-night-800 px-4 py-2 font-body text-sm font-semibold text-gold-bright transition-colors hover:bg-night-700">New Calculation</button>
          </div>

          <p className="font-body text-xs text-parchment-faint">
            Negation stacks multiplicatively. Base values are at Lv15. Conditional buffs only apply under their stated
            condition. Tier-stacking buffs count one copy per rarity tier.
          </p>
        </div>
      )}
    </div>
  );
}

function EffectRow({ source, inst, onChange, onRemove, curse }: {
  source: EffectSource; inst: Inst; onChange: (v: Inst) => void; onRemove: () => void; curse?: boolean;
}) {
  const eff = inst.effectId ? NEG_EFFECT_MAP[inst.effectId] : undefined;
  const opts = NEG_EFFECTS.filter((e) => e.source === source);
  const groups = Array.from(new Set(opts.map((o) => o.group)));
  return (
    <div className="flex items-center gap-1.5">
      <select value={inst.effectId} onChange={(e) => onChange({ effectId: e.target.value, element: inst.element })}
        className={`min-w-0 flex-1 rounded border bg-night-900 px-2 py-1.5 font-body text-xs text-parchment focus:outline-none ${curse ? "border-red-500/40 focus:border-red-400" : "border-night-600 focus:border-gold-faint"}`}>
        <option value="">{curse ? "Select curse…" : "Select effect…"}</option>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {opts.filter((o) => o.group === g).map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.value > 0 ? `+${o.value}` : o.value}%){o.noStack ? " · no stack" : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {eff?.needsElement && (
        <select value={inst.element ?? "magic"} onChange={(e) => onChange({ ...inst, element: e.target.value as NegType })}
          className="rounded border border-night-600 bg-night-900 px-1.5 py-1.5 font-body text-xs text-parchment focus:border-gold-faint focus:outline-none">
          {ELEMENTS.map((el) => <option key={el} value={el}>{NEG_LABELS[el]}</option>)}
        </select>
      )}
      <button type="button" onClick={onRemove} aria-label="Remove" className="grid h-7 w-7 shrink-0 place-items-center rounded border border-night-600 text-parchment-faint hover:text-gold">×</button>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const on = step === "character" ? 1 : 2;
  return (
    <div className="mb-6 flex items-center justify-center gap-3 font-body text-xs">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${on >= 1 ? "border-sky-400 bg-sky-500/20 text-sky-300" : "border-night-600 text-parchment-faint"}`}>{step === "character" ? "1" : "✓"}</span>
      <span className="uppercase tracking-wide text-parchment-faint">Character</span>
      <span className="h-px w-16 bg-night-600" />
      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${on >= 2 ? "border-sky-400 bg-sky-500/20 text-sky-300" : "border-night-600 text-parchment-faint"}`}>2</span>
      <span className="uppercase tracking-wide text-parchment-faint">Buffs</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="frame rounded-lg bg-night-850/40 p-4">
      <h3 className="eyebrow mb-3 text-sky-300">{title}</h3>
      {children}
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {onBack ? <button type="button" onClick={onBack} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700">← Back</button> : <span />}
      <button type="button" onClick={onNext} className="rounded-lg border border-gold-faint bg-night-800 px-5 py-2 font-display text-sm font-semibold text-gold-bright transition-colors hover:bg-night-700">{nextLabel}</button>
    </div>
  );
}
