"use client";

import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/components/Dropdown";
import { StatIcon } from "@/components/StatIcon";
import { NEG_ICONS } from "@/lib/negationCalc";
import {
  ATTACK_EFFECTS,
  ATTACK_EFFECT_MAP,
  ATK_ELEMENTS,
  computeAttack,
  DMG_LABELS,
  DMG_TYPES,
  type AppliedAtk,
  type AtkSource,
  type AttackEffect,
  type DmgType,
} from "@/lib/attackCalc";

type Step = "weapon" | "relics" | "passives" | "results";
interface Inst { effectId: string; element?: DmgType }
interface Relic { enabled: boolean; effects: Inst[] }
interface CustomBuff { label: string; value: number }
interface Build {
  ar: number; split: Record<DmgType, number>; rawBackstab: string; rawRiposte: string;
  relics: Relic[]; talismanSlots: string[]; weaponPassives: Inst[]; custom: CustomBuff[];
}

const NEW_RELICS = (): Relic[] => Array.from({ length: 6 }, () => ({ enabled: false, effects: [] }));
const ZERO_SPLIT = (): Record<DmgType, number> => ({ physical: 100, magic: 0, fire: 0, lightning: 0, holy: 0 });
const STORAGE_KEY = "nr-attack-build";

function effectOptions(source: AtkSource) {
  return ATTACK_EFFECTS.filter((e) => e.source === source).map((o) => ({
    value: o.id,
    group: o.group,
    icon: o.element ? NEG_ICONS[o.element] : undefined,
    label: `${o.label} (+${o.value}%${o.element ? ` ${DMG_LABELS[o.element]}` : ""})${o.critOnly ? " · crit only" : ""}`,
  }));
}
function effLabel(eff: AttackEffect, element?: DmgType) {
  return eff.label.replace("[Element]", element ? DMG_LABELS[element] : "Element");
}

export function AttackCalculator() {
  const [step, setStep] = useState<Step>("weapon");
  const [ar, setAr] = useState(100);
  const [split, setSplit] = useState<Record<DmgType, number>>(ZERO_SPLIT);
  const [raw, setRaw] = useState<Record<DmgType, number>>({ physical: 0, magic: 0, fire: 0, lightning: 0, holy: 0 });
  const [rawBackstab, setRawBackstab] = useState("");
  const [rawRiposte, setRawRiposte] = useState("");
  const [relics, setRelics] = useState<Relic[]>(NEW_RELICS);
  const [talismanSlots, setTalismanSlots] = useState<string[]>(["", ""]);
  const [weaponPassives, setWeaponPassives] = useState<Inst[]>([]);
  const [custom, setCustom] = useState<CustomBuff[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Persist / restore the build (single, not per-character).
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Build | null;
      if (b) {
        setAr(b.ar ?? 100); setSplit(b.split ?? ZERO_SPLIT()); setRawBackstab(b.rawBackstab ?? "");
        setRawRiposte(b.rawRiposte ?? ""); setRelics(b.relics ?? NEW_RELICS());
        setTalismanSlots(b.talismanSlots ?? ["", ""]); setWeaponPassives(b.weaponPassives ?? []); setCustom(b.custom ?? []);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ar, split, rawBackstab, rawRiposte, relics, talismanSlots, weaponPassives, custom }));
    } catch { /* ignore */ }
  }, [loaded, ar, split, rawBackstab, rawRiposte, relics, talismanSlots, weaponPassives, custom]);

  function patchRelic(i: number, fn: (r: Relic) => Relic) {
    setRelics((prev) => prev.map((r, idx) => (idx === i ? fn(r) : r)));
  }
  function clearAll() {
    setRelics(NEW_RELICS()); setTalismanSlots(["", ""]); setWeaponPassives([]); setCustom([]);
  }

  // Resolve all buffs (relics stack every copy; weapon/talisman dedupe by id+element).
  const buffRows = useMemo(() => {
    const seen = new Set<string>();
    const rows: { eff: AttackEffect; element?: DmgType }[] = [];
    const add = (inst: Inst) => {
      const eff = inst.effectId ? ATTACK_EFFECT_MAP[inst.effectId] : undefined;
      if (!eff) return;
      const element = eff.needsElement ? inst.element ?? "magic" : eff.element;
      if (eff.stack === "no") {
        const k = `${eff.id}:${element ?? ""}`;
        if (seen.has(k)) return;
        seen.add(k);
      }
      rows.push({ eff, element });
    };
    relics.forEach((r) => { if (r.enabled) r.effects.forEach(add); });
    talismanSlots.forEach((id) => { if (id) add({ effectId: id }); });
    weaponPassives.forEach(add);
    return rows;
  }, [relics, talismanSlots, weaponPassives]);

  const customRows = useMemo(() => custom.filter((c) => c.value), [custom]);

  const applied: AppliedAtk[] = useMemo(() => [
    ...buffRows.map(({ eff, element }) => ({ scope: eff.scope, value: eff.value, element, critOnly: eff.critOnly })),
    ...customRows.map((c) => ({ scope: "all" as const, value: c.value })),
  ], [buffRows, customRows]);

  const result = useMemo(
    () => computeAttack(ar, split, applied, { rawBackstab: Number(rawBackstab) || undefined, rawRiposte: Number(rawRiposte) || undefined }),
    [ar, split, applied, rawBackstab, rawRiposte],
  );

  const splitTotal = DMG_TYPES.reduce((n, t) => n + (split[t] || 0), 0);
  const buffCount = buffRows.length + customRows.length;

  function calcSplit() {
    const sum = DMG_TYPES.reduce((n, t) => n + (raw[t] || 0), 0);
    if (sum <= 0) return;
    const pct = {} as Record<DmgType, number>;
    let acc = 0; let maxT: DmgType = "physical";
    DMG_TYPES.forEach((t) => { pct[t] = Math.round(((raw[t] || 0) / sum) * 100); acc += pct[t]; if ((raw[t] || 0) >= (raw[maxT] || 0)) maxT = t; });
    pct[maxT] += 100 - acc; // fix rounding so it sums to 100
    setSplit(pct);
  }

  return (
    <div>
      <Steps step={step} />

      {step === "weapon" && (
        <Section title="Weapon Configuration">
          <Field label="Attack Rating (AR) — from Sparring Grounds">
            <input type="number" value={ar} min={0} onChange={(e) => setAr(Math.max(0, Number(e.target.value) || 0))}
              className="w-full max-w-xs rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-display text-lg font-bold text-parchment focus:border-gold-faint focus:outline-none" />
            <p className="mt-1 font-body text-xs text-parchment-faint">Equip the weapon at your level, hit the Sparring Grounds dummy, and enter that number. It already bakes in your stats, level and scaling.</p>
          </Field>

          <Field label="Critical Hit Multipliers">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CritInput label="Backstab (blank = AR ×1.6)" value={rawBackstab} onChange={setRawBackstab} placeholder={`${Math.round(ar * 1.6)}`} />
              <CritInput label="Riposte (blank = AR ×2.0)" value={rawRiposte} onChange={setRawRiposte} placeholder={`${Math.round(ar * 2.0)}`} />
            </div>
            <p className="mt-1 font-body text-xs text-parchment-faint">Leave blank to use the default multipliers, or enter the raw dummy numbers (no relics/buffs) for exact crit values.</p>
          </Field>

          <Field label="Damage Type % Split">
            <p className="mb-2 font-body text-xs text-parchment-faint">Set each damage type&rsquo;s share — total must equal 100%.</p>
            <div className="mb-3 rounded-lg border border-night-700 bg-night-900/40 p-3">
              <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-gold-bright">⚡ Split Calculator</p>
              <p className="mb-2 font-body text-xs text-parchment-faint">Enter the raw damage numbers shown on your weapon, then auto-fill the % split.</p>
              <div className="space-y-1.5">
                {DMG_TYPES.map((t) => (
                  <SplitRow key={t} type={t} value={raw[t]} onChange={(v) => setRaw((p) => ({ ...p, [t]: v }))} suffix="" />
                ))}
              </div>
              <button type="button" onClick={calcSplit} className="mt-2 w-full rounded border border-night-600 bg-night-800 px-3 py-1.5 font-display text-xs font-semibold text-gold-bright hover:bg-night-700">Calculate % split</button>
            </div>
            <div className="space-y-1.5">
              {DMG_TYPES.map((t) => (
                <SplitRow key={t} type={t} value={split[t]} onChange={(v) => setSplit((p) => ({ ...p, [t]: v }))} suffix="%" />
              ))}
            </div>
            <p className={`mt-2 font-body text-xs ${splitTotal === 100 ? "text-parchment-faint" : "text-red-300"}`}>Total: {splitTotal}%{splitTotal !== 100 ? " — should be 100% (values are renormalized if not)" : ""}</p>
          </Field>

          <Nav onNext={() => setStep("relics")} nextLabel="Next: Relics →" />
        </Section>
      )}

      {step === "relics" && (
        <div className="space-y-6">
          <TopBar onBack={() => setStep("weapon")} onClear={clearAll} />
          <Section title="Relic Configuration — 6 Relic Slots">
            <p className="mb-3 rounded-lg border border-red-500/30 bg-night-800/60 px-4 py-2 text-center font-body text-sm text-red-200/90">All relic buffs are assumed active at maximum value. Each copy of an attack-up stacks.</p>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {relics.map((relic, i) => (
                <div key={i} className={`rounded-lg border p-3 ${relic.enabled ? "border-gold-faint bg-night-800" : "border-night-700 bg-night-900/40"}`}>
                  <button type="button" onClick={() => patchRelic(i, (r) => ({ ...r, enabled: !r.enabled, effects: !r.enabled && r.effects.length === 0 ? [{ effectId: "" }] : r.effects }))}
                    className="flex w-full items-center gap-2 font-display text-sm font-semibold text-parchment">
                    <span className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${relic.enabled ? "bg-gold" : "bg-night-600"}`}>
                      <span className={`h-3 w-3 rounded-full bg-night-950 transition-transform ${relic.enabled ? "translate-x-3" : ""}`} />
                    </span>
                    Relic {i + 1}
                  </button>
                  {relic.enabled && (
                    <div className="mt-2 space-y-1.5">
                      {relic.effects.map((inst, j) => (
                        <EffectRow key={j} source="relic" inst={inst}
                          onChange={(v) => patchRelic(i, (r) => ({ ...r, effects: r.effects.map((e, k) => (k === j ? v : e)) }))}
                          onRemove={() => patchRelic(i, (r) => ({ ...r, effects: r.effects.filter((_, k) => k !== j) }))} />
                      ))}
                      <button type="button" onClick={() => patchRelic(i, (r) => ({ ...r, effects: [...r.effects, { effectId: "" }] }))}
                        className="w-full rounded border border-dashed border-night-600 px-2 py-1 font-body text-xs text-gold-bright hover:bg-night-700">+ Add Effect</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
          <Nav onBack={() => setStep("weapon")} onNext={() => setStep("passives")} nextLabel="Next: Passives →" />
        </div>
      )}

      {step === "passives" && (
        <div className="space-y-6">
          <TopBar onBack={() => setStep("relics")} onClear={clearAll} />
          <Section title="Talismans">
            <p className="mb-3 font-body text-sm text-parchment-muted">Equip up to 2 damage talismans.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1].map((slot) => (
                <label key={slot} className="flex flex-col gap-1">
                  <span className="font-body text-[0.65rem] uppercase tracking-wide text-parchment-faint">Talisman Slot {slot + 1}</span>
                  <Dropdown value={talismanSlots[slot]} searchable placeholder="None" options={effectOptions("talisman")}
                    onChange={(v) => setTalismanSlots((s) => s.map((x, i) => (i === slot ? v : x)))} />
                </label>
              ))}
            </div>
          </Section>

          <Section title="Weapon Passives">
            <p className="mb-3 font-body text-sm text-parchment-muted">Attack passives found on weapons. Same name + value = one copy.</p>
            <div className="space-y-1.5">
              {weaponPassives.map((inst, j) => (
                <EffectRow key={j} source="weapon" inst={inst}
                  onChange={(v) => setWeaponPassives((w) => w.map((e, k) => (k === j ? v : e)))}
                  onRemove={() => setWeaponPassives((w) => w.filter((_, k) => k !== j))} />
              ))}
            </div>
            <button type="button" onClick={() => setWeaponPassives((w) => [...w, { effectId: "" }])}
              className="mt-2 w-full rounded border border-dashed border-night-600 px-2 py-1.5 font-body text-xs text-gold-bright hover:bg-night-700">+ Add Weapon Passive</button>
          </Section>

          <Section title="Custom Buffs">
            <p className="mb-3 font-body text-sm text-parchment-muted">Any buff not listed above. Enter the % as a whole number (e.g. 12 for +12%). Applies to all damage types.</p>
            <div className="space-y-1.5">
              {custom.map((c, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <input value={c.label} placeholder="Buff name" onChange={(e) => setCustom((p) => p.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)))}
                    className="min-w-0 flex-1 rounded border border-night-600 bg-night-900 px-2 py-1.5 font-body text-sm text-parchment focus:border-gold-faint focus:outline-none" />
                  <input type="number" value={c.value || ""} placeholder="%" onChange={(e) => setCustom((p) => p.map((x, k) => (k === j ? { ...x, value: Number(e.target.value) || 0 } : x)))}
                    className="w-20 rounded border border-night-600 bg-night-900 px-2 py-1.5 font-body text-sm text-parchment focus:border-gold-faint focus:outline-none" />
                  <button type="button" onClick={() => setCustom((p) => p.filter((_, k) => k !== j))} aria-label="Remove" className="grid h-9 w-9 shrink-0 place-items-center rounded border border-night-600 text-parchment-faint hover:text-gold">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setCustom((p) => [...p, { label: "", value: 0 }])}
              className="mt-2 w-full rounded border border-dashed border-night-600 px-2 py-1.5 font-body text-xs text-gold-bright hover:bg-night-700">+ Add Custom Buff</button>
          </Section>

          <Nav onBack={() => setStep("relics")} onNext={() => setStep("results")} nextLabel="Calculate Damage" />
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <TopBar onBack={() => setStep("passives")} onClear={clearAll} backLabel="← Edit Buffs" />
          <div className="frame rounded-lg bg-night-850 p-4 text-center">
            <p className="eyebrow text-gold-bright">Damage Breakdown</p>
            <p className="mt-1 font-body text-sm text-parchment-muted">{DMG_TYPES.filter((t) => split[t]).map((t) => `${DMG_LABELS[t]} ${split[t]}%`).join(" · ") || "No split set"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Attack Rating" value={Math.round(ar)} sub="As shown in-game" />
            <Stat label="Active Buffs" value={buffCount} sub="Each a separate multiplier" />
            <Stat label="Combined Multiplier" value={`×${result.weightedR1.toFixed(3)}`} sub="Weighted across types" />
            <Stat label="Light Attack (R1)" value={Math.round(result.r1)} sub="Primary hit output" gold />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Backstab" value={Math.round(result.backstab)} sub={rawBackstab ? "From raw value" : "AR ×1.6 × buffs"} />
            <Stat label="Riposte" value={Math.round(result.riposte)} sub={rawRiposte ? "From raw value" : "AR ×2.0 × buffs"} />
          </div>

          <Section title="Multiplicative Buffs (assumed fully active)">
            {buffCount === 0 ? (
              <p className="font-body text-sm text-parchment-faint">No buffs added — output is raw AR.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-gold-faint/40 text-parchment-faint">
                      <th className="py-2 pr-3 font-semibold">Buff</th>
                      <th className="px-2 py-2 font-semibold">Source</th>
                      <th className="px-2 py-2 font-semibold">Context</th>
                      <th className="px-2 py-2 text-right font-semibold">Value</th>
                      <th className="px-2 py-2 text-right font-semibold">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buffRows.map(({ eff, element }, i) => (
                      <tr key={`b${i}`} className="border-b border-night-800/70">
                        <td className="py-2 pr-3 text-parchment"><span className="inline-flex items-center gap-1">{element && NEG_ICONS[element] && <StatIcon src={NEG_ICONS[element]!} alt="" size={13} />}{effLabel(eff, element)}</span></td>
                        <td className="px-2 py-2 capitalize text-parchment-muted">{eff.source}</td>
                        <td className="px-2 py-2 text-parchment-muted">{eff.condition ?? (eff.critOnly ? "Critical hits" : "Always active")}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-gold-dim">+{eff.value}%</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-gold-bright">×{(1 + eff.value / 100).toFixed(3)}</td>
                      </tr>
                    ))}
                    {customRows.map((c, i) => (
                      <tr key={`c${i}`} className="border-b border-night-800/70">
                        <td className="py-2 pr-3 text-parchment">{c.label || "Custom buff"}</td>
                        <td className="px-2 py-2 text-parchment-muted">custom</td>
                        <td className="px-2 py-2 text-parchment-muted">Always active</td>
                        <td className="px-2 py-2 text-right tabular-nums text-gold-dim">+{c.value}%</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-gold-bright">×{(1 + c.value / 100).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 rounded-md bg-night-900/60 px-3 py-2 font-body text-sm text-parchment-muted">Weighted multiplier (R1): <span className="font-semibold text-gold-bright">×{result.weightedR1.toFixed(3)}</span> · crit: <span className="font-semibold text-gold-bright">×{result.weightedCrit.toFixed(3)}</span></p>
          </Section>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("passives")} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted hover:bg-night-700">← Edit Buffs</button>
            <button type="button" onClick={() => { clearAll(); setStep("weapon"); }} className="rounded-lg border border-gold-faint bg-night-800 px-4 py-2 font-body text-sm font-semibold text-gold-bright hover:bg-night-700">New Calculation</button>
          </div>
          <p className="font-body text-xs text-parchment-faint">All buffs are assumed active at maximum value; each is a separate multiplier (they multiply, not add). Situational buffs (charged, jump, low HP…) only apply to the matching hit — add only the ones relevant to the attack you&rsquo;re modeling.</p>
        </div>
      )}
    </div>
  );
}

function EffectRow({ source, inst, onChange, onRemove }: { source: AtkSource; inst: Inst; onChange: (v: Inst) => void; onRemove: () => void }) {
  const eff = inst.effectId ? ATTACK_EFFECT_MAP[inst.effectId] : undefined;
  return (
    <div className="flex items-center gap-1.5">
      <Dropdown value={inst.effectId} searchable className="min-w-0 flex-1" placeholder="Search effect…"
        options={effectOptions(source)} onChange={(v) => onChange({ effectId: v, element: inst.element })} />
      {eff?.needsElement && (
        <Dropdown value={inst.element ?? "magic"} clearable={false} className="w-32 shrink-0"
          options={ATK_ELEMENTS.map((el) => ({ value: el, label: DMG_LABELS[el], icon: NEG_ICONS[el] }))}
          onChange={(v) => onChange({ ...inst, element: v as DmgType })} />
      )}
      <button type="button" onClick={onRemove} aria-label="Remove" className="grid h-9 w-9 shrink-0 place-items-center rounded border border-night-600 text-parchment-faint hover:text-gold">×</button>
    </div>
  );
}

function SplitRow({ type, value, onChange, suffix }: { type: DmgType; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-28 items-center gap-1.5 font-body text-sm text-parchment-muted">
        {NEG_ICONS[type] && <StatIcon src={NEG_ICONS[type]!} alt="" size={14} />}{DMG_LABELS[type]}
      </span>
      <input type="number" value={value || ""} min={0} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-24 rounded border border-night-600 bg-night-900 px-2 py-1.5 font-body text-sm text-parchment focus:border-gold-faint focus:outline-none" />
      {suffix && <span className="font-body text-sm text-parchment-faint">{suffix}</span>}
    </div>
  );
}

function CritInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-[0.65rem] uppercase tracking-wide text-parchment-faint">{label}</span>
      <input type="number" value={value} placeholder={placeholder} min={0} onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none" />
    </label>
  );
}

function Stat({ label, value, sub, gold }: { label: string; value: string | number; sub: string; gold?: boolean }) {
  return (
    <div className="frame rounded-lg bg-night-850 p-3 text-center">
      <p className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${gold ? "text-gold-bright" : "text-parchment"}`}>{value}</p>
      <p className="mt-1 font-body text-[0.65rem] text-parchment-faint">{sub}</p>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const idx = step === "weapon" ? 1 : step === "relics" ? 2 : 3;
  const items: [string, number][] = [["Weapon", 1], ["Relics", 2], ["Passives", 3]];
  return (
    <div className="mb-6 flex items-center justify-center gap-3 font-body text-xs">
      {items.map(([label, n], i) => (
        <div key={label} className="flex items-center gap-3">
          {i > 0 && <span className="h-px w-10 bg-night-600 sm:w-16" />}
          <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${idx >= n ? "border-gold-faint bg-gold/20 text-gold-bright" : "border-night-600 text-parchment-faint"}`}>{idx > n ? "✓" : n}</span>
          <span className="uppercase tracking-wide text-parchment-faint">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="frame rounded-lg bg-night-850/40 p-4">
      <h3 className="eyebrow mb-3 text-gold-bright">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 font-body text-[0.65rem] uppercase tracking-wide text-parchment-faint">{label}</p>
      {children}
    </div>
  );
}

function TopBar({ onBack, onClear, backLabel = "← Back" }: { onBack: () => void; onClear: () => void; backLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted hover:bg-night-700">{backLabel}</button>
      <button type="button" onClick={onClear} className="rounded-lg border border-red-500/40 bg-night-800 px-4 py-2 font-body text-sm text-red-300 hover:bg-night-700">Clear all</button>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {onBack ? <button type="button" onClick={onBack} className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 font-body text-sm text-parchment-muted hover:bg-night-700">← Back</button> : <span />}
      <button type="button" onClick={onNext} className="rounded-lg border border-gold-faint bg-night-800 px-5 py-2 font-display text-sm font-semibold text-gold-bright hover:bg-night-700">{nextLabel}</button>
    </div>
  );
}
