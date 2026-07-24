"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { characterChalices, grailChalices } from "@/data/chalices";
import { asset } from "@/lib/assets";
import {
  EMPTY_SLOTS,
  EMPTY_STORE,
  fixedRelics,
  fixedRelicsFor,
  loadStore,
  mergeStores,
  newId,
  normalizeStore,
  saveStore,
  type Build,
  type BuildSlot,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
} from "@/lib/builds";
import { SLOT_ICON, type Chalice, type SlotColor } from "@/lib/chalices";
import {
  EFFECT_VOCABULARY,
  matchOcrLines,
  parseRelicGroups,
  type EffectMatch,
  type ParsedRelicGroup,
} from "@/lib/effectMatch";

const RELIC_COLORS: CustomRelic["color"][] = ["Red", "Blue", "Green", "Yellow"];

/** Slot address within a build: normal or Deep of Night, index 0–2. */
type SlotRef = { deep: boolean; index: number };

/**
 * User builds, stored locally in the browser (no account, no server). The
 * list view shows saved builds per Nightfarer; the editor is a full-width
 * view with searchable relic pickers, Deep of Night slots, and a
 * whole-screenshot importer that fills slots from a photo.
 */
export function BuildsManager() {
  const [store, setStore] = useState<BuildStore | null>(null);
  const [character, setCharacter] = useState(characterChalices[0].name);
  const [editing, setEditing] = useState<Build | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => setStore(loadStore()), []);

  if (!store) {
    return <p className="font-body text-sm text-parchment-faint">Loading saved builds…</p>;
  }

  const update = (fn: (s: BuildStore) => BuildStore) => {
    setStore((prev) => {
      const next = fn(prev ?? EMPTY_STORE);
      saveStore(next);
      return next;
    });
  };

  const addCustomRelic = (relic: CustomRelic) =>
    update((s) => ({ ...s, customRelics: [...s.customRelics, relic] }));

  if (editing) {
    return (
      <BuildEditor
        key={editing.id}
        initial={editing}
        store={store}
        onSave={(build) => {
          update((s) => ({
            ...s,
            builds: [...s.builds.filter((b) => b.id !== build.id), { ...build, updatedAt: Date.now() }],
          }));
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
        onAddCustomRelic={addCustomRelic}
      />
    );
  }

  const builds = store.builds
    .filter((b) => b.character === character)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const startNew = () =>
    setEditing({
      id: newId(),
      name: "",
      character,
      chalice: chalicesFor(character)[0].name,
      slots: [...EMPTY_SLOTS] as SlotTriple,
      deepSlots: [...EMPTY_SLOTS] as SlotTriple,
      notes: "",
      updatedAt: Date.now(),
    });

  const deleteBuild = (id: string) => {
    if (!window.confirm("Delete this build?")) return;
    update((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) }));
  };

  const deleteCustomRelic = (id: string) => {
    if (!window.confirm("Delete this relic? Builds using it will show an empty slot.")) return;
    const strip = (slots: SlotTriple): SlotTriple =>
      slots.map((s) => (s?.kind === "custom" && s.id === id ? null : s)) as SlotTriple;
    update((s) => ({
      ...s,
      customRelics: s.customRelics.filter((r) => r.id !== id),
      builds: s.builds.map((b) => ({ ...b, slots: strip(b.slots), deepSlots: strip(b.deepSlots) })),
    }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nightreign-builds.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const data = normalizeStore(JSON.parse(await file.text()));
      if (!data) throw new Error("bad file");
      update((s) => mergeStores(s, data));
    } catch {
      window.alert("That file doesn't look like a Nightreign builds export.");
    }
  };

  return (
    <div>
      {/* Character selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {characterChalices.map((c) => {
          const active = c.name === character;
          const count = store.builds.filter((b) => b.character === c.name).length;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setCharacter(c.name)}
              aria-pressed={active}
              className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
                active
                  ? "bg-night-700 text-gold-bright"
                  : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
              }`}
              style={active ? { borderColor: "#c9a227" } : undefined}
            >
              {c.name}
              {count > 0 && <span className="ml-1.5 text-xs text-parchment-faint">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={startNew} className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600">
          + New build
        </button>
        <button type="button" onClick={exportJson} className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment">
          Export JSON
        </button>
        <button type="button" onClick={() => importRef.current?.click()} className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment">
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        <span className="font-body text-xs text-parchment-faint">
          Saved in this browser only — export to back up or move devices.
        </span>
      </div>

      {builds.length === 0 ? (
        <p className="font-body text-sm text-parchment-faint">
          No builds for {character} yet — create one, or import a backup.
        </p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} store={store} onEdit={() => setEditing(b)} onDelete={() => deleteBuild(b.id)} />
          ))}
        </div>
      )}

      <MyRelics relics={store.customRelics} onDelete={deleteCustomRelic} />
    </div>
  );
}

// ── Shared helpers ───────────────────────────────────────────────────────

/** The chalices a character can equip: their own vessels plus the grails. */
function chalicesFor(character: string): Chalice[] {
  const own = characterChalices.find((c) => c.name === character)?.chalices ?? [];
  return [...own, ...grailChalices];
}

function resolveSlot(slot: BuildSlot, store: BuildStore): { name: string; color: SlotColor; effects: string[] } | null {
  if (!slot) return null;
  if (slot.kind === "fixed") {
    const r = fixedRelics.find((f) => f.name === slot.name);
    return r ? { name: r.name, color: r.color, effects: r.effects } : null;
  }
  const r = store.customRelics.find((c) => c.id === slot.id);
  return r ? { name: r.name || `${r.color} relic`, color: r.color, effects: r.effects } : null;
}

/** Infer a relic color from a scene name (Drizzly=Blue, Tranquil=Green in-game). */
function colorFromRelicName(name: string | null): CustomRelic["color"] | null {
  if (!name) return null;
  if (/burning/i.test(name)) return "Red";
  if (/drizzly/i.test(name)) return "Blue";
  if (/tranquil/i.test(name)) return "Green";
  if (/luminous/i.test(name)) return "Yellow";
  return null;
}

/** Run OCR on an image and return its text lines. Loads Tesseract lazily. */
async function ocrLines(file: File, onProgress: (status: string) => void): Promise<string[]> {
  onProgress("Loading OCR engine (downloads a few MB on first use)…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(`Reading screenshot… ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text.split("\n");
}

function SlotIconImg({ color, size = 20 }: { color: SlotColor; size?: number }) {
  return (
    <Image src={asset(SLOT_ICON[color])} alt={color} title={color} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
  );
}

// ── List view ────────────────────────────────────────────────────────────

function BuildCard({ build, store, onEdit, onDelete }: { build: Build; store: BuildStore; onEdit: () => void; onDelete: () => void }) {
  const chalice = chalicesFor(build.character).find((c) => c.name === build.chalice);
  const hasDeep = build.deepSlots.some(Boolean);
  const renderSlots = (slots: SlotTriple, colors?: readonly SlotColor[]) =>
    slots.map((slot, i) => {
      const resolved = resolveSlot(slot, store);
      return (
        <div key={i} className="flex items-start gap-2">
          {colors?.[i] && <SlotIconImg color={colors[i]} />}
          {resolved ? (
            <div className="min-w-0">
              <p className="font-body text-sm text-parchment">{resolved.name}</p>
              <p className="font-body text-xs leading-snug text-parchment-muted">{resolved.effects.join(" · ")}</p>
            </div>
          ) : (
            <p className="font-body text-sm text-parchment-faint">Empty slot</p>
          )}
        </div>
      );
    });

  return (
    <article className="frame rounded-md bg-night-800 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display font-semibold text-parchment">{build.name || "Unnamed build"}</h4>
          <p className="font-body text-xs text-parchment-faint">{build.chalice}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onEdit} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright">Edit</button>
          <button type="button" onClick={onDelete} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300">Delete</button>
        </div>
      </div>
      <div className="mt-3 space-y-2">{renderSlots(build.slots, chalice?.slots)}</div>
      {hasDeep && (
        <div className="mt-3 border-t border-night-700 pt-2">
          <p className="eyebrow mb-1.5 text-gold-dim">Deep of Night</p>
          <div className="space-y-2">{renderSlots(build.deepSlots, chalice?.deep)}</div>
        </div>
      )}
      {build.notes && <p className="mt-2 font-body text-xs text-parchment-faint">{build.notes}</p>}
    </article>
  );
}

function MyRelics({ relics, onDelete }: { relics: CustomRelic[]; onDelete: (id: string) => void }) {
  if (relics.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold text-parchment">My Relics</h3>
      <p className="mt-1 font-body text-xs text-parchment-faint">
        Custom relics you&rsquo;ve added — usable in any build with a matching slot.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {relics.map((r) => (
          <div key={r.id} className="frame flex items-start justify-between gap-2 rounded-md bg-night-800 p-3">
            <div className="flex items-start gap-2">
              <SlotIconImg color={r.color} />
              <div>
                <p className="font-body text-sm text-parchment">{r.name || `${r.color} relic`}</p>
                <p className="font-body text-xs leading-snug text-parchment-muted">{r.effects.join(" · ")}</p>
              </div>
            </div>
            <button type="button" onClick={() => onDelete(r.id)} className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editor view ──────────────────────────────────────────────────────────

function BuildEditor({
  initial,
  store,
  onSave,
  onCancel,
  onAddCustomRelic,
}: {
  initial: Build;
  store: BuildStore;
  onSave: (b: Build) => void;
  onCancel: () => void;
  onAddCustomRelic: (r: CustomRelic) => void;
}) {
  const [build, setBuild] = useState<Build>(initial);
  const [newRelicAt, setNewRelicAt] = useState<SlotRef | null>(null);
  const chalices = chalicesFor(build.character);
  const chalice = chalices.find((c) => c.name === build.chalice) ?? chalices[0];

  const setSlot = (at: SlotRef, slot: BuildSlot) =>
    setBuild((b) => {
      const key = at.deep ? "deepSlots" : "slots";
      const slots = [...b[key]] as SlotTriple;
      slots[at.index] = slot;
      return { ...b, [key]: slots };
    });

  const applyGroup = (group: ParsedRelicGroup, at: SlotRef) => {
    const slotColor = (at.deep ? chalice.deep : chalice.slots)[at.index];
    const fixed = group.name ? fixedRelics.find((r) => r.name === group.name) : null;
    if (fixed) {
      setSlot(at, { kind: "fixed", name: fixed.name });
      return;
    }
    const color =
      colorFromRelicName(group.name) ?? (slotColor === "White" ? "Red" : (slotColor as CustomRelic["color"]));
    const relic: CustomRelic = {
      id: newId(),
      name: group.name ?? "",
      color,
      effects: group.effects.map((e) => e.effect).slice(0, 3),
    };
    onAddCustomRelic(relic);
    setSlot(at, { kind: "custom", id: relic.id });
  };

  const slotSection = (deep: boolean) => {
    const colors = deep ? chalice.deep : chalice.slots;
    return colors.map((slotColor, index) => {
      const at: SlotRef = { deep, index };
      const isNewHere = newRelicAt?.deep === deep && newRelicAt.index === index;
      const value = deep ? build.deepSlots[index] : build.slots[index];
      const resolved = resolveSlot(value, store);
      return (
        <div key={index} className="frame rounded-md bg-night-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SlotIconImg color={slotColor} size={26} />
            <RelicPicker
              character={build.character}
              slotColor={slotColor}
              store={store}
              value={value}
              onChange={(slot) => setSlot(at, slot)}
              onNewRelic={() => setNewRelicAt(isNewHere ? null : at)}
            />
          </div>
          {resolved && (
            <p className="mt-1.5 font-body text-xs leading-snug text-parchment-muted">
              {resolved.effects.join(" · ")}
            </p>
          )}
          {isNewHere && (
            <CustomRelicEditor
              slotColor={slotColor}
              onSave={(relic) => {
                onAddCustomRelic(relic);
                setSlot(at, { kind: "custom", id: relic.id });
                setNewRelicAt(null);
              }}
              onCancel={() => setNewRelicAt(null)}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div>
      <button type="button" onClick={onCancel} className="mb-4 font-body text-sm text-parchment-muted hover:text-gold-bright">
        ← All builds
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={build.name}
          onChange={(e) => setBuild((b) => ({ ...b, name: e.target.value }))}
          placeholder="Build name"
          className="frame w-64 rounded bg-night-900 px-3 py-2 font-display text-lg text-parchment placeholder:text-parchment-faint"
        />
        <ChalicePicker
          chalices={chalices}
          value={chalice}
          onChange={(name) =>
            setBuild((b) => ({ ...b, chalice: name, slots: [...EMPTY_SLOTS] as SlotTriple, deepSlots: [...EMPTY_SLOTS] as SlotTriple }))
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="eyebrow mb-2">Relic Slots</h3>
          <div className="space-y-3">{slotSection(false)}</div>
        </section>
        <section>
          <h3 className="eyebrow mb-2 text-gold-dim">Deep of Night Slots</h3>
          <div className="space-y-3">{slotSection(true)}</div>
        </section>
      </div>

      <ScreenshotBuildImport chalice={chalice} onApply={applyGroup} />

      <textarea
        value={build.notes}
        onChange={(e) => setBuild((b) => ({ ...b, notes: e.target.value }))}
        placeholder="Notes (optional)"
        rows={2}
        className="frame mt-5 w-full rounded bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint"
      />

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onSave(build)} className="frame rounded-md bg-night-700 px-5 py-2 font-body text-sm text-gold-bright hover:bg-night-600">
          Save build
        </button>
        <button type="button" onClick={onCancel} className="frame rounded-md bg-night-800 px-5 py-2 font-body text-sm text-parchment-muted hover:text-parchment">
          Cancel
        </button>
      </div>

      {/* Shared autocomplete list for effect inputs */}
      <datalist id="effect-vocab">
        {EFFECT_VOCABULARY.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
    </div>
  );
}

// ── Pickers ──────────────────────────────────────────────────────────────

function ChalicePicker({ chalices, value, onChange }: { chalices: Chalice[]; value: Chalice; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="frame flex items-center gap-2 rounded-md bg-night-900 px-3 py-2 font-body text-sm text-parchment hover:bg-night-800"
      >
        <span>{value.name}</span>
        <span className="flex items-center gap-0.5">
          {value.slots.map((s, i) => (
            <SlotIconImg key={i} color={s} size={16} />
          ))}
        </span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-parchment-faint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 max-h-80 w-[26rem] max-w-[90vw] overflow-y-auto rounded-md border border-night-500 bg-night-850 p-1 shadow-lift">
            {chalices.map((c) => {
              const active = c.name === value.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left font-body text-sm ${
                    active ? "bg-night-700 text-gold-bright" : "text-parchment-muted hover:bg-night-800 hover:text-parchment"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {c.slots.map((s, i) => (
                      <SlotIconImg key={`n${i}`} color={s} size={16} />
                    ))}
                    <span className="mx-1 h-4 w-px bg-night-600" aria-hidden="true" />
                    {c.deep.map((s, i) => (
                      <span key={`d${i}`} className="opacity-60">
                        <SlotIconImg color={s} size={16} />
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
            <p className="px-2 py-1 font-body text-[0.65rem] text-parchment-faint">
              Bright icons: normal slots · dimmed: Deep of Night
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function RelicPicker({
  character,
  slotColor,
  store,
  value,
  onChange,
  onNewRelic,
}: {
  character: string;
  slotColor: SlotColor;
  store: BuildStore;
  value: BuildSlot;
  onChange: (slot: BuildSlot) => void;
  onNewRelic: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const resolved = resolveSlot(value, store);

  const fixed = fixedRelicsFor(character, slotColor);
  const custom = store.customRelics.filter((r) => slotColor === "White" || r.color === slotColor);
  const query = q.trim().toLowerCase();
  const matches = (name: string, effects: string[], char?: string) =>
    !query ||
    name.toLowerCase().includes(query) ||
    (char ?? "").toLowerCase().includes(query) ||
    effects.some((e) => e.toLowerCase().includes(query));
  const filteredCustom = custom.filter((r) => matches(r.name || `${r.color} relic`, r.effects));
  const filteredFixed = fixed.filter((r) => matches(r.name, r.effects, r.character));

  const pick = (slot: BuildSlot) => {
    onChange(slot);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="frame flex w-full items-center justify-between gap-2 rounded-md bg-night-900 px-3 py-1.5 text-left font-body text-sm text-parchment hover:bg-night-800"
      >
        <span className={`truncate ${resolved ? "" : "text-parchment-faint"}`}>
          {resolved?.name ?? "— Empty —"}
        </span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-parchment-faint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setQ(""); }} />
          <div className="absolute left-0 right-0 z-40 mt-1 rounded-md border border-night-500 bg-night-850 shadow-lift">
            <input
              type="text"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setQ(""); }
                if (e.key === "Enter") {
                  const first = filteredCustom[0]
                    ? ({ kind: "custom", id: filteredCustom[0].id } as BuildSlot)
                    : filteredFixed[0]
                      ? ({ kind: "fixed", name: filteredFixed[0].name } as BuildSlot)
                      : undefined;
                  if (first !== undefined) pick(first);
                }
              }}
              placeholder="Search relics or effects…"
              className="w-full border-b border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
            />
            <div className="max-h-72 overflow-y-auto p-1">
              <button type="button" onClick={() => pick(null)} className="w-full rounded px-2 py-1.5 text-left font-body text-sm text-parchment-faint hover:bg-night-800 hover:text-parchment">
                — Empty —
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setQ(""); onNewRelic(); }}
                className="w-full rounded px-2 py-1.5 text-left font-body text-sm text-gold-dim hover:bg-night-800 hover:text-gold-bright"
              >
                + New custom relic…
              </button>
              {filteredCustom.length > 0 && <p className="eyebrow px-2 pb-0.5 pt-2 text-[0.6rem]">My relics</p>}
              {filteredCustom.map((r) => (
                <PickerRow
                  key={r.id}
                  name={r.name || `${r.color} relic`}
                  detail={r.effects.join(" · ")}
                  onClick={() => pick({ kind: "custom", id: r.id })}
                />
              ))}
              {filteredFixed.length > 0 && <p className="eyebrow px-2 pb-0.5 pt-2 text-[0.6rem]">Relics</p>}
              {filteredFixed.map((r) => (
                <PickerRow
                  key={r.name}
                  name={r.name}
                  tag={r.character && r.character !== character ? r.character : undefined}
                  detail={r.effects.join(" · ")}
                  onClick={() => pick({ kind: "fixed", name: r.name })}
                />
              ))}
              {filteredCustom.length === 0 && filteredFixed.length === 0 && (
                <p className="px-2 py-2 font-body text-xs text-parchment-faint">Nothing matches “{q}”.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PickerRow({ name, tag, detail, onClick }: { name: string; tag?: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded px-2 py-1.5 text-left hover:bg-night-800">
      <span className="font-body text-sm text-parchment">
        {name}
        {tag && <span className="ml-1.5 rounded border border-night-600 px-1 font-body text-[0.6rem] text-parchment-faint">{tag}</span>}
      </span>
      <span className="block truncate font-body text-xs text-parchment-faint">{detail}</span>
    </button>
  );
}

// ── Custom relic editor (single relic, with per-relic screenshot parse) ──

function CustomRelicEditor({
  slotColor,
  onSave,
  onCancel,
}: {
  slotColor: SlotColor;
  onSave: (r: CustomRelic) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<CustomRelic["color"]>(slotColor === "White" ? "Red" : slotColor);
  const [effects, setEffects] = useState<string[]>(["", "", ""]);
  const lockedColor = slotColor !== "White";

  const setEffect = (i: number, v: string) => setEffects((e) => e.map((x, j) => (j === i ? v : x)));

  const addParsedEffect = (effect: string) =>
    setEffects((e) => {
      if (e.some((x) => x === effect)) return e;
      const i = e.findIndex((x) => !x.trim());
      return i === -1 ? e : e.map((x, j) => (j === i ? effect : x));
    });

  const save = () => {
    const cleaned = effects.map((e) => e.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      window.alert("Add at least one effect.");
      return;
    }
    onSave({ id: newId(), name: name.trim(), color, effects: cleaned });
  };

  return (
    <div className="frame mt-2 rounded-md bg-night-900 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Relic name (optional)"
          className="frame w-52 rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <select
          value={color}
          disabled={lockedColor}
          onChange={(e) => setColor(e.target.value as CustomRelic["color"])}
          className="frame rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment disabled:opacity-60"
        >
          {RELIC_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mt-2 space-y-1.5">
        {effects.map((e, i) => (
          <input
            key={i}
            type="text"
            value={e}
            list="effect-vocab"
            onChange={(ev) => setEffect(i, ev.target.value)}
            placeholder={`Effect ${i + 1}${i === 0 ? "" : " (optional)"}`}
            className="frame w-full rounded bg-night-800 px-2 py-1 font-body text-sm text-parchment placeholder:text-parchment-faint"
          />
        ))}
      </div>

      <SingleRelicParse onPick={addParsedEffect} />

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={save} className="frame rounded-md bg-night-700 px-3 py-1 font-body text-sm text-gold-bright hover:bg-night-600">
          Save relic
        </button>
        <button type="button" onClick={onCancel} className="frame rounded-md bg-night-800 px-3 py-1 font-body text-sm text-parchment-muted hover:text-parchment">
          Cancel
        </button>
      </div>
    </div>
  );
}

function SingleRelicParse({ onPick }: { onPick: (effect: string) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<EffectMatch[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = async (file: File) => {
    setBusy(true);
    setMatches(null);
    try {
      const lines = await ocrLines(file, setStatus);
      const found = matchOcrLines(lines);
      setMatches(found);
      setStatus(
        found.length > 0
          ? "Click an effect to add it — then fix anything the parser got wrong."
          : "No relic effects recognized. Try a sharper, closer screenshot of the effect text.",
      );
    } catch {
      setStatus("Couldn't run the parser — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-night-700 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="frame rounded-md bg-night-800 px-3 py-1 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-50"
        >
          Parse screenshot
        </button>
        <span className="font-body text-xs text-parchment-faint">
          {status ?? "Prefill effects from a photo of this relic's effect text."}
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parse(f);
          e.target.value = "";
        }}
      />
      {matches && matches.length > 0 && (
        <ul className="mt-2 space-y-1">
          {matches.slice(0, 10).map((m) => (
            <li key={m.effect}>
              <button
                type="button"
                onClick={() => onPick(m.effect)}
                className="w-full rounded border border-night-700 px-2 py-1 text-left font-body text-xs text-parchment-muted hover:border-night-500 hover:text-parchment"
              >
                {m.effect}
                <span className={`ml-2 ${m.score >= 0.8 ? "text-emerald-300/80" : "text-yellow-300/70"}`}>
                  {Math.round(m.score * 100)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Whole-screenshot import ──────────────────────────────────────────────

const SLOT_TARGETS: { label: string; at: SlotRef }[] = [
  { label: "Slot 1", at: { deep: false, index: 0 } },
  { label: "Slot 2", at: { deep: false, index: 1 } },
  { label: "Slot 3", at: { deep: false, index: 2 } },
  { label: "Deep 1", at: { deep: true, index: 0 } },
  { label: "Deep 2", at: { deep: true, index: 1 } },
  { label: "Deep 3", at: { deep: true, index: 2 } },
];

function ScreenshotBuildImport({ chalice, onApply }: { chalice: Chalice; onApply: (g: ParsedRelicGroup, at: SlotRef) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [groups, setGroups] = useState<ParsedRelicGroup[] | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [applied, setApplied] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = async (file: File) => {
    setBusy(true);
    setGroups(null);
    try {
      const lines = await ocrLines(file, setStatus);
      const found = parseRelicGroups(lines);
      setGroups(found);
      setTargets(found.map((_, i) => Math.min(i, SLOT_TARGETS.length - 1)));
      setApplied(found.map(() => false));
      setStatus(
        found.length > 0
          ? `Found ${found.length} relic${found.length === 1 ? "" : "s"} — check each one, pick its slot, and apply.`
          : "No relics recognized. Try a sharper screenshot of the relic list.",
      );
    } catch {
      setStatus("Couldn't run the parser — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="frame mt-6 rounded-md bg-night-850 p-4">
      <h3 className="eyebrow">Import from game screenshot</h3>
      <p className="mt-1 max-w-prose font-body text-xs text-parchment-faint">
        Screenshot the relic rites screen (relic names + effects visible), and
        the parser will group what it reads into relics you can drop into
        slots. Fix anything it misreads afterwards — OCR is rarely perfect.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-50"
        >
          Parse screenshot
        </button>
        {status && <span className="font-body text-xs text-parchment-faint">{status}</span>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parse(f);
          e.target.value = "";
        }}
      />
      {groups && groups.length > 0 && (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {groups.map((g, i) => (
            <div key={i} className="frame rounded-md bg-night-900 p-3">
              <p className="font-body text-sm text-parchment">
                {g.name ?? <span className="text-parchment-faint">Unnamed relic</span>}
              </p>
              <ul className="mt-1 space-y-0.5">
                {g.effects.map((e) => (
                  <li key={e.effect} className="font-body text-xs text-parchment-muted">
                    {e.effect}
                    <span className={`ml-1.5 ${e.score >= 0.8 ? "text-emerald-300/80" : "text-yellow-300/70"}`}>
                      {Math.round(e.score * 100)}%
                    </span>
                  </li>
                ))}
                {g.effects.length === 0 && (
                  <li className="font-body text-xs text-parchment-faint">No effects read — applies as a fixed relic.</li>
                )}
              </ul>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={targets[i]}
                  onChange={(e) => setTargets((t) => t.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                  className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment"
                >
                  {SLOT_TARGETS.map((t, j) => {
                    const color = t.at.deep ? chalice.deep[t.at.index] : chalice.slots[t.at.index];
                    return (
                      <option key={t.label} value={j}>
                        {t.label} ({color})
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  disabled={applied[i]}
                  onClick={() => {
                    onApply(g, SLOT_TARGETS[targets[i]].at);
                    setApplied((a) => a.map((x, j) => (j === i ? true : x)));
                  }}
                  className="frame rounded-md bg-night-700 px-3 py-1 font-body text-xs text-gold-bright hover:bg-night-600 disabled:opacity-50"
                >
                  {applied[i] ? "Applied ✓" : "Apply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
