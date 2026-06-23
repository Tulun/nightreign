"use client";

import { useEffect, useMemo, useState } from "react";
import { nightfarers } from "@/data/characters";
import { Dropdown } from "@/components/Dropdown";
import { StatIcon } from "@/components/StatIcon";
import {
  computeNegations,
  NEG_ICONS,
  ELEMENTS,
  NEG_EFFECTS,
  NEG_EFFECT_MAP,
  NEG_LABELS,
  NEG_TYPES,
  scopeLabel,
  stackNote,
  type AppliedNeg,
  type EffectSource,
  type NegEffect,
  type NegType,
} from "@/lib/negationCalc";

type Step = "character" | "buffs" | "results";
interface Inst { effectId: string; element?: NegType }
interface Relic { enabled: boolean; effects: Inst[]; curses: Inst[] }
interface Loadout { relics: Relic[]; weapons: Inst[]; talismanSlots: string[]; condOn: Record<string, boolean> }

const NEW_RELICS = (): Relic[] => Array.from({ length: 6 }, () => ({ enabled: false, effects: [], curses: [] }));

/** Group display/sort order in the pickers and summary. */
const GROUP_ORDER = ["Physical", "Conditional", "Affinity", "Elemental", "Penalty", "Curse"];

const STORAGE_KEY = "nr-negation-loadouts";
function readStore(): Record<string, Loadout> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function writeStore(s: Record<string, Loadout>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function NegationCalculator() {
  const [step, setStep] = useState<Step>("character");
  const [charName, setCharName] = useState(nightfarers[0].name);
  const [relics, setRelics] = useState<Relic[]>(NEW_RELICS);
  const [weapons, setWeapons] = useState<Inst[]>([]);
  const [talismanSlots, setTalismanSlots] = useState<string[]>(["", ""]);
  const [condOn, setCondOn] = useState<Record<string, boolean>>({});
  const [hit, setHit] = useState(1000);

  const [loaded, setLoaded] = useState(false);
  const character = nightfarers.find((c) => c.name === charName) ?? nightfarers[0];

  function applyLoadout(l?: Loadout) {
    setRelics(l?.relics ?? NEW_RELICS());
    setWeapons(l?.weapons ?? []);
    setTalismanSlots(l?.talismanSlots ?? ["", ""]);
    setCondOn(l?.condOn ?? {});
  }

  // Restore the last-used character and its loadout on mount.
  useEffect(() => {
    let last: string | null = null;
    try { last = localStorage.getItem("nr-negation-char"); } catch { /* ignore */ }
    const initial = last && nightfarers.some((c) => c.name === last) ? last : charName;
    if (initial !== charName) setCharName(initial);
    applyLoadout(readStore()[initial]);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the current character's loadout whenever it changes.
  useEffect(() => {
    if (!loaded) return;
    const s = readStore();
    s[charName] = { relics, weapons, talismanSlots, condOn };
    writeStore(s);
  }, [loaded, charName, relics, weapons, talismanSlots, condOn]);

  function selectChar(name: string) {
    try { localStorage.setItem("nr-negation-char", name); } catch { /* ignore */ }
    applyLoadout(readStore()[name]);
    setCharName(name);
  }

  function clearAll() {
    applyLoadout(undefined);
  }

  function patchRelic(i: number, fn: (r: Relic) => Relic) {
    setRelics((prev) => prev.map((r, idx) => (idx === i ? fn(r) : r)));
  }

  // Every applied instance. "yes" effects count each copy; "tiers"/"no" dedupe by tier.
  const activeEffects = useMemo(() => {
    const seen = new Set<string>();
    const out: { eff: NegEffect; element?: NegType }[] = [];
    const add = (inst: Inst) => {
      const eff = inst.effectId ? NEG_EFFECT_MAP[inst.effectId] : undefined;
      if (!eff) return;
      const element = eff.needsElement ? inst.element ?? "magic" : eff.element;
      if (eff.stack !== "yes") {
        const key = `${eff.id}:${element ?? ""}`;
        if (seen.has(key)) return;
        seen.add(key);
      }
      out.push({ eff, element });
    };
    relics.forEach((r) => { if (r.enabled) { r.effects.forEach(add); r.curses.forEach(add); } });
    talismanSlots.forEach((id) => { if (id) add({ effectId: id }); });
    weapons.forEach(add);
    return out;
  }, [relics, weapons, talismanSlots]);

  const effKey = (eff: NegEffect, element?: NegType) => `${eff.id}:${element ?? ""}`;

  // Group identical instances for display (shows a ×N multiplier when stacked).
  const grouped = useMemo(() => {
    const m = new Map<string, { eff: NegEffect; element?: NegType; count: number }>();
    for (const { eff, element } of activeEffects) {
      const k = effKey(eff, element);
      const g = m.get(k);
      if (g) g.count++;
      else m.set(k, { eff, element, count: 1 });
    }
    return Array.from(m.values());
  }, [activeEffects]);

  const alwaysOn = grouped
    .filter(({ eff }) => !eff.condition)
    .sort((a, b) => GROUP_ORDER.indexOf(a.eff.group) - GROUP_ORDER.indexOf(b.eff.group));
  const conditional = grouped.filter(({ eff }) => eff.condition);
  const condKeys = conditional.map(({ eff, element }) => effKey(eff, element));
  const allCondOn = condKeys.length > 0 && condKeys.every((k) => condOn[k]);

  const applied: AppliedNeg[] = useMemo(
    () =>
      activeEffects
        .filter(({ eff, element }) => !eff.condition || condOn[`${eff.id}:${element ?? ""}`])
        .map(({ eff, element }) => ({ scope: eff.scope, value: eff.value, element })),
    [activeEffects, condOn],
  );
  const final = useMemo(() => computeNegations(character.negations, applied), [character, applied]);

  return (
    <div>
      <Steps step={step} />

      {step === "character" && (
        <Section title="Character">
          <label className="mb-4 flex max-w-sm flex-col gap-1">
            <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">Nightfarer</span>
            <Dropdown value={charName} clearable={false}
              options={nightfarers.map((c) => ({ value: c.name, label: c.name }))}
              onChange={selectChar} />
          </label>
          <p className="mb-2 font-body text-sm text-parchment-muted">Base negation at Lv15 — all damage types:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NEG_TYPES.map((t) => (
              <div key={t} className="flex items-center justify-between gap-2 rounded-md border border-night-700 bg-night-900/60 px-3 py-2">
                <span className="flex min-w-0 items-center gap-1.5 font-body text-sm text-parchment-muted">
                  {NEG_ICONS[t] && <StatIcon src={NEG_ICONS[t]!} alt="" size={14} />}
                  {NEG_LABELS[t]}
                </span>
                <span className="font-display text-sm font-bold tabular-nums text-sky-300">{character.negations[t]}%</span>
              </div>
            ))}
          </div>
          <Nav onNext={() => setStep("buffs")} nextLabel="Next: Buffs →" />
        </Section>
      )}

      {step === "buffs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep("character")} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700">← Back</button>
            <button type="button" onClick={clearAll} className="rounded-lg border border-red-500/40 bg-night-800 px-4 py-2 font-body text-sm text-red-300 transition-colors hover:bg-night-700">Clear all</button>
          </div>

          <Section title="Negation Relics">
            <p className="mb-3 rounded-lg border border-night-600 bg-night-800/60 px-4 py-2 font-body text-sm text-parchment-muted">
              Up to 6 relics, each holding negation effects. Most stack with every copy; some only stack across
              different tiers, and a few don&rsquo;t stack at all (noted on each). Add a Curse penalty if your relic carries one.
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

          <Section title="Defensive Talismans">
            <p className="mb-3 font-body text-sm text-parchment-muted">Select up to 2 talismans with negation effects.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1].map((slot) => (
                <label key={slot} className="flex flex-col gap-1">
                  <span className="font-body text-[0.65rem] uppercase tracking-wide text-parchment-faint">Talisman Slot {slot + 1}</span>
                  <TalismanSelect value={talismanSlots[slot]} onChange={(v) => setTalismanSlots((s) => s.map((x, i) => (i === slot ? v : x)))} />
                </label>
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
          </Section>

          <Nav onBack={() => setStep("character")} onNext={() => setStep("results")} nextLabel="Calculate Negation" />
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep("buffs")} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700">← Edit Buffs</button>
            <button type="button" onClick={clearAll} className="rounded-lg border border-red-500/40 bg-night-800 px-4 py-2 font-body text-sm text-red-300 transition-colors hover:bg-night-700">Clear all</button>
          </div>

          <div className="frame rounded-lg bg-night-850 p-4 text-center">
            <p className="eyebrow text-sky-300">Negation Breakdown</p>
            <p className="mt-1 font-display text-2xl font-bold text-parchment">{character.name}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Always active */}
            <Section title="Always Active">
              <ul className="space-y-1.5 font-body text-sm">
                <li className="flex items-center justify-between gap-3 rounded-md border border-night-700 bg-night-900/40 px-3 py-2">
                  <span className="text-parchment-muted">Base negation <span className="text-parchment-faint">(Lv15 · {character.name})</span></span>
                  <span className="font-semibold tabular-nums text-parchment-faint">base</span>
                </li>
                {alwaysOn.map(({ eff, element, count }, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-night-700 bg-night-900/40 px-3 py-2">
                    <span className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-parchment">{element && NEG_ICONS[element] && <StatIcon src={NEG_ICONS[element]!} alt="" size={13} />}{effLabel(eff, element)}</span>
                      {count > 1 && <span className="ml-1.5 rounded bg-night-700 px-1 text-[0.65rem] font-semibold text-gold-bright">×{count}</span>}
                      <span className="block text-[0.7rem] text-parchment-faint">{scopeLabel(eff.scope, element)}{stackNote(eff.stack) && ` · ${stackNote(eff.stack)}`}</span>
                    </span>
                    <span className={`shrink-0 font-semibold tabular-nums ${eff.value < 0 ? "text-red-300" : "text-sky-300"}`}>{eff.value > 0 ? `+${eff.value}` : eff.value}%</span>
                  </li>
                ))}
              </ul>
              {alwaysOn.length === 0 && <p className="mt-2 font-body text-xs text-parchment-faint">No unconditional buffs — only base negation applies.</p>}
            </Section>

            {/* Conditional */}
            <Section title="Conditional Buffs">
              {conditional.length === 0 ? (
                <p className="font-body text-sm text-parchment-faint">No conditional buffs in this build.</p>
              ) : (
                <>
                  <button type="button" onClick={() => setCondOn((p) => { const v = !allCondOn; const next = { ...p }; condKeys.forEach((k) => (next[k] = v)); return next; })}
                    className="mb-2 w-full rounded border border-night-600 bg-night-800 px-3 py-1.5 font-body text-xs font-semibold text-gold-bright transition-colors hover:bg-night-700">
                    {allCondOn ? "Disable all conditions" : "Assume all conditions met"}
                  </button>
                  <ul className="space-y-1.5">
                    {conditional.map(({ eff, element, count }, i) => {
                      const k = effKey(eff, element);
                      const on = !!condOn[k];
                      return (
                        <li key={i}>
                          <button type="button" onClick={() => setCondOn((p) => ({ ...p, [k]: !p[k] }))}
                            className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left font-body text-sm transition-colors ${on ? "border-emerald-500/50 bg-emerald-500/10" : "border-night-700 bg-night-900/40 hover:bg-night-800"}`}>
                            <span className={`inline-flex h-4 w-7 shrink-0 items-center rounded-full px-0.5 transition-colors ${on ? "bg-emerald-500" : "bg-night-600"}`}>
                              <span className={`h-3 w-3 rounded-full bg-night-950 transition-transform ${on ? "translate-x-3" : ""}`} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="inline-flex items-center gap-1 text-parchment">{element && NEG_ICONS[element] && <StatIcon src={NEG_ICONS[element]!} alt="" size={13} />}{effLabel(eff, element)}</span>
                              {count > 1 && <span className="ml-1.5 rounded bg-night-700 px-1 text-[0.65rem] font-semibold text-gold-bright">×{count}</span>}
                              <span className="block text-[0.7rem] text-parchment-faint">{eff.condition} · {scopeLabel(eff.scope, element)}{stackNote(eff.stack) && ` · ${stackNote(eff.stack)}`}</span>
                            </span>
                            <span className={`shrink-0 font-semibold tabular-nums ${eff.value < 0 ? "text-red-300" : "text-sky-300"}`}>{eff.value > 0 ? `+${eff.value}` : eff.value}%</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 font-body text-[0.7rem] italic text-parchment-faint">Toggle the conditions you want to assume are active. Some are mutually exclusive (e.g. low HP vs. full HP).</p>
                </>
              )}
            </Section>
          </div>

          <Section title="Cumulative Negation by Damage Type">
            <p className="mb-3 font-body text-sm text-parchment-muted">Base + always-active + the conditions you enabled, stacked multiplicatively.</p>
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
                    const gained = f - character.negations[t];
                    return (
                      <tr key={t} className="border-b border-night-800/70">
                        <td className="py-2 pr-3 font-display font-semibold text-parchment">
                          <span className="flex items-center gap-1.5">{NEG_ICONS[t] && <StatIcon src={NEG_ICONS[t]!} alt="" size={14} />}{NEG_LABELS[t]}</span>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-parchment-faint">{character.negations[t]}%</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-sky-300">
                          {f.toFixed(1)}%{gained > 0.05 && <span className="ml-1 text-[0.7rem] text-emerald-400">+{gained.toFixed(1)}</span>}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-parchment-muted">×{mult.toFixed(3)}</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-gold-dim">~{Math.round(hit * mult)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("buffs")} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted transition-colors hover:bg-night-700">← Edit Buffs</button>
            <button type="button" onClick={() => { setRelics(NEW_RELICS()); setWeapons([]); setTalismanSlots(["", ""]); setCondOn({}); setStep("character"); }}
              className="rounded-lg border border-gold-faint bg-night-800 px-4 py-2 font-body text-sm font-semibold text-gold-bright transition-colors hover:bg-night-700">New Calculation</button>
          </div>

          <p className="font-body text-xs text-parchment-faint">
            Negation stacks multiplicatively — you can never reach 100%. Base values are at Lv15. Most effects stack with
            every copy; &ldquo;tiers only&rdquo; effects count one copy per rarity tier; &ldquo;does not stack&rdquo; effects (e.g. poise &amp; knockback)
            count once. Conditional buffs apply only when enabled above.
          </p>
        </div>
      )}
    </div>
  );
}

function effLabel(eff: NegEffect, element?: NegType) {
  return eff.label.replace("[Element]", element ? NEG_LABELS[element] : "Element");
}

function effectOptions(source: EffectSource) {
  return NEG_EFFECTS.filter((e) => e.source === source)
    .slice()
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
    .map((o) => {
      const note = stackNote(o.stack);
      return {
        value: o.id,
        group: o.group,
        icon: o.element ? NEG_ICONS[o.element] : undefined,
        label: `${o.label} (${o.value > 0 ? `+${o.value}` : o.value}%${o.element ? ` ${NEG_LABELS[o.element]}` : ""})${note ? ` · ${note}` : ""}`,
      };
    });
}

function EffectRow({ source, inst, onChange, onRemove, curse }: {
  source: EffectSource; inst: Inst; onChange: (v: Inst) => void; onRemove: () => void; curse?: boolean;
}) {
  const eff = inst.effectId ? NEG_EFFECT_MAP[inst.effectId] : undefined;
  return (
    <div className="flex items-center gap-1.5">
      <Dropdown value={inst.effectId} className="min-w-0 flex-1" tone={curse ? "curse" : "default"}
        placeholder={curse ? "Select curse…" : "Select effect…"}
        options={effectOptions(source)}
        onChange={(v) => onChange({ effectId: v, element: inst.element })} />
      {eff?.needsElement && (
        <Dropdown value={inst.element ?? "magic"} clearable={false} className="w-32 shrink-0"
          options={ELEMENTS.map((el) => ({ value: el, label: NEG_LABELS[el], icon: NEG_ICONS[el] }))}
          onChange={(v) => onChange({ ...inst, element: v as NegType })} />
      )}
      <button type="button" onClick={onRemove} aria-label="Remove" className="grid h-9 w-9 shrink-0 place-items-center rounded border border-night-600 text-parchment-faint hover:text-gold">×</button>
    </div>
  );
}

function TalismanSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Dropdown value={value} placeholder="None" options={effectOptions("talisman")} onChange={onChange} />;
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
