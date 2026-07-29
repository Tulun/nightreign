"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Editor view: full-width build editor with searchable relic pickers,
//  Deep of Night slots, tags, and the whole-screenshot importer.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { characterChalices } from "@/data/chalices";
import { MultiSelect } from "@/components/MultiSelect";
import {
  EMPTY_SLOTS,
  fixedRelics,
  matchFixedByEffects,
  MAX_VARIANTS,
  newId,
  sameCustomRelic,
  slotsForColors,
  slottedFixedNames,
  sortedTags,
  variantAt,
  variantCount,
  variantLabel,
  withVariantLabel,
  withVariantPatch,
  type Build,
  type BuildSlot,
  type BuildStore,
  type CustomRelic,
  type SlotTriple,
  type VariantView,
} from "@/lib/builds";
import type { Chalice, SlotColor } from "@/lib/chalices";
import { loadoutEffectStates } from "@/lib/effectCompat";
import { CustomRelicEditor } from "./CustomRelicEditor";
import { RelicPicker } from "./RelicBrowser";
import { ScreenshotBuildImport } from "./ScreenshotImport";
import {
  chalicesFor,
  colorFromRelicName,
  resolveSlot,
  EffectLines,
  RelicLineInputs,
  SlotIconImg,
  type SlotRef,
} from "./shared";

/** Stable empty set for slots that can't hold a fixed relic in the first place. */
const NO_FIXED: Set<string> = new Set();

export function BuildEditor({
  initial,
  store,
  onSave,
  onCancel,
  backLabel = "← All builds",
  lockCharacter = false,
  onAddCustomRelic,
  onUpdateCustomRelic,
  onCreateTag,
}: {
  initial: Build;
  store: BuildStore;
  onSave: (b: Build) => void;
  onCancel: () => void;
  /** Where leaving the editor goes back to — the list, or the build's page. */
  backLabel?: string;
  /** Saved builds keep their Nightfarer — only a new build picks one. */
  lockCharacter?: boolean;
  onAddCustomRelic: (r: CustomRelic) => void;
  onUpdateCustomRelic: (r: CustomRelic) => void;
  onCreateTag: (name: string) => void;
}) {
  const [build, setBuild] = useState<Build>(initial);
  // The build as it stands right now, readable without waiting for a render:
  // "Apply all" runs a whole batch of slot fills in one tick, and each one has
  // to see the slots the ones before it filled (a fixed relic already down
  // can't go down twice). Every update goes through patchBuild to keep both in
  // step — setBuild alone would leave the ref behind.
  const buildRef = useRef(build);
  const patchBuild = (fn: (b: Build) => Build) => {
    buildRef.current = fn(buildRef.current);
    setBuild(buildRef.current);
  };
  // Which loadout variant the editor is working on (0 = the build's own).
  const [variant, setVariant] = useState(0);
  const [newRelicAt, setNewRelicAt] = useState<SlotRef | null>(null);
  // Slots switched into line-by-line editing (see slotSection). A slot reads
  // as the relic by default — six slots' worth of open effect inputs is a
  // wall of form fields where what the user is working on is a build.
  const [editing, setEditing] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  // Relics a chalice swap emptied out, reported until the next swap.
  const [cleared, setCleared] = useState<{ chalice: string; count: number } | null>(null);
  // A scanned relic the importer read as a fixed relic the loadout already
  // has — kept as a custom relic instead, and said so rather than silently.
  const [duped, setDuped] = useState<string | null>(null);
  const loadout = variantAt(build, variant);
  const chalices = chalicesFor(build.character);
  const chalice = chalices.find((c) => c.name === loadout.chalice) ?? chalices[0];

  const slotKey = (at: SlotRef) => `${at.deep ? "d" : "n"}${at.index}`;
  const openEditing = (at: SlotRef) =>
    setEditing((cur) => (cur.includes(slotKey(at)) ? cur : [...cur, slotKey(at)]));
  const closeEditing = (at: SlotRef) =>
    setEditing((cur) => cur.filter((k) => k !== slotKey(at)));

  // A pending new-relic form points at a slot of the variant it was opened
  // on — close it rather than carry it across to another loadout's slot.
  // Open effect inputs belong to the slot they were opened on too.
  const switchVariant = (i: number) => {
    setVariant(i);
    setNewRelicAt(null);
    setEditing([]);
    setCleared(null);
    setDuped(null);
  };

  /** This loadout's slots re-checked against a chalice's socket colors. */
  const refit = (slots: SlotTriple, colors: readonly SlotColor[]) =>
    slotsForColors(slots, colors, store);

  // Swapping chalices keeps every relic the new sockets still accept and
  // empties the ones they don't — the game won't equip a Red relic in a Blue
  // socket, so carrying it across would only show a build no one can run.
  const setChalice = (name: string) => {
    const target = chalices.find((c) => c.name === name);
    if (!target) return;
    const normal = refit(loadout.slots, target.slots);
    const deep = refit(loadout.deepSlots, target.deep);
    patchBuild((b) =>
      withVariantPatch(b, variant, {
        chalice: name,
        slots: normal.slots,
        deepSlots: deep.slots,
      }),
    );
    const count = normal.cleared + deep.cleared;
    setCleared(count > 0 ? { chalice: target.name, count } : null);
  };

  // A new variant starts as a copy of the one on screen — variants are
  // takes on the same idea, so tweaking beats starting from empty slots.
  const addVariant = () => {
    patchBuild((b) => {
      if (variantCount(b) >= MAX_VARIANTS) return b;
      const cur = variantAt(b, variant);
      return {
        ...b,
        variants: [
          ...(b.variants ?? []),
          {
            name: "",
            chalice: cur.chalice,
            slots: [...cur.slots] as SlotTriple,
            deepSlots: [...cur.deepSlots] as SlotTriple,
          },
        ],
      };
    });
    switchVariant(variantCount(build)); // the copy's index, once it exists
  };

  const removeVariant = () => {
    if (variant === 0) return;
    if (!window.confirm(`Remove ${variantLabel(build, variant)}? Its slots are discarded.`)) return;
    patchBuild((b) => ({ ...b, variants: (b.variants ?? []).filter((_, j) => j !== variant - 1) }));
    switchVariant(variant - 1);
  };

  // Create the tag in the registry and put it on this build in one step.
  const addNewTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    onCreateTag(tag);
    patchBuild((b) => ({ ...b, tags: sortedTags([...(b.tags ?? []), tag]) }));
    setNewTag("");
  };

  const setSlot = (at: SlotRef, slot: BuildSlot) => {
    patchBuild((b) => {
      const key = at.deep ? "deepSlots" : "slots";
      const slots = [...variantAt(b, variant)[key]] as SlotTriple;
      slots[at.index] = slot;
      return withVariantPatch(b, variant, { [key]: slots });
    });
    // Filling a slot supersedes its pending new-relic form, and the relic
    // that leaves takes its open effect inputs with it.
    setNewRelicAt((cur) => (cur && cur.deep === at.deep && cur.index === at.index ? null : cur));
    setEditing((cur) => cur.filter((k) => k !== slotKey(at)));
  };

  // Reuse an identical pool relic instead of adding a duplicate — the same
  // relic imported twice (or owned twice) is one pool entry slotted twice.
  // The ref also covers relics added earlier in the same batch (Apply all),
  // before the parent's state update lands.
  const pendingRelics = useRef<CustomRelic[]>([]);
  const addOrReuseRelic = (relic: CustomRelic): string => {
    const existing =
      store.customRelics.find((r) => sameCustomRelic(r, relic)) ??
      pendingRelics.current.find((r) => sameCustomRelic(r, relic));
    if (existing) return existing.id;
    pendingRelics.current.push(relic);
    onAddCustomRelic(relic);
    return relic.id;
  };

  const applyGroup = (
    group: {
      name: string | null;
      effects: string[];
      demerits: string[];
      color?: CustomRelic["color"] | null;
    },
    at: SlotRef,
  ) => {
    const slotColor = (at.deep ? chalice.deep : chalice.slots)[at.index];
    // Deep slots never take fixed relics — every Depth relic is a custom
    // roll, even when it shares a name with a fixed one.
    // Fixed relics the loadout already holds, read live — a batch of Apply all
    // lands before any of it renders.
    const taken = slottedFixedNames(variantAt(buildRef.current, variant).slots, at.index);
    if (!at.deep) {
      const byName = group.name ? fixedRelics.find((r) => r.name === group.name) : null;
      // No name from OCR? The effects can still give the relic away: an
      // effect that can't roll pins it to its fixed relic outright; an exact
      // copy of a fixed relic's effect set might just be a lucky roll — ask.
      const byEffects = byName ? null : matchFixedByEffects(group.effects);
      const candidate = byName ?? byEffects?.relic ?? null;
      const fixed = (() => {
        // A fixed relic is a single in-game item, so one already sitting in
        // another socket of this loadout can't be here too — a second read of
        // it is a misread, and falls through to a custom relic below with what
        // was scanned kept for the user to correct.
        if (!candidate || taken.has(candidate.name)) return null;
        if (byName) return byName;
        if (!byEffects) return null;
        if (byEffects.certain) return byEffects.relic;
        return window.confirm(
          `These effects exactly match ${byEffects.relic.name}. Slot that relic?\n\n(Cancel keeps it as a custom relic that happens to have the same effects.)`,
        )
          ? byEffects.relic
          : null;
      })();
      if (fixed) {
        setSlot(at, { kind: "fixed", name: fixed.name });
        return;
      }
      if (candidate && taken.has(candidate.name)) setDuped(candidate.name);
    }
    // A colored slot dictates the relic's color; the sampled icon color only
    // decides for White slots (the screenshot's blue cast makes it easy to
    // misread, so the slot is the better authority).
    const color =
      (slotColor !== "White" ? (slotColor as CustomRelic["color"]) : null) ??
      group.color ??
      colorFromRelicName(group.name) ??
      "Red";
    const id = addOrReuseRelic({
      id: newId(),
      name: group.name ?? "",
      color,
      effects: group.effects.slice(0, 3),
      demerits: group.demerits.slice(0, 3),
      deep: at.deep,
    });
    setSlot(at, { kind: "custom", id });
  };

  // Emptying a set of slots one Remove at a time is the tedious part of
  // reworking a build — this does the set in one go. A single relic goes
  // without asking; more than that is worth confirming.
  const clearSlots = (deep: boolean) => {
    const key = deep ? "deepSlots" : "slots";
    const filled = loadout[key].filter(Boolean).length;
    if (filled === 0) return;
    const what = deep ? "Deep of Night slots" : "relic slots";
    if (filled > 1 && !window.confirm(`Clear all ${filled} relics from the ${what}?`)) return;
    patchBuild((b) => withVariantPatch(b, variant, { [key]: [...EMPTY_SLOTS] as SlotTriple }));
    setNewRelicAt((cur) => (cur && cur.deep === deep ? null : cur));
    setEditing((cur) => cur.filter((k) => k.startsWith(deep ? "n" : "d")));
  };

  const slotSection = (deep: boolean) => {
    const colors = deep ? chalice.deep : chalice.slots;
    // Whether each effect lands, judged across the set the slot belongs to —
    // an override only ever comes from a relic in the same three sockets.
    const states = loadoutEffectStates(
      build.character,
      (deep ? loadout.deepSlots : loadout.slots).map(
        (slot) => (resolveSlot(slot, store)?.lines ?? []).map((l) => l.text),
      ),
    );
    return colors.map((slotColor, index) => {
      const at: SlotRef = { deep, index };
      const isNewHere = newRelicAt?.deep === deep && newRelicAt.index === index;
      const value = deep ? loadout.deepSlots[index] : loadout.slots[index];
      const resolved = resolveSlot(value, store);
      const customRelic =
        value?.kind === "custom" ? store.customRelics.find((r) => r.id === value.id) : undefined;
      // A relic with nothing on it yet has nothing to read, so it opens
      // straight into its inputs; anything else reads as the relic until the
      // user asks to edit it.
      const blank = !!customRelic && !customRelic.effects.some((e) => e.trim());
      const editingLines = !!customRelic && (blank || editing.includes(slotKey(at)));
      return (
        <div key={index} className="frame rounded-md bg-night-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SlotIconImg color={slotColor} size={26} />
            <RelicPicker
              character={build.character}
              slotColor={slotColor}
              deep={deep}
              store={store}
              value={value}
              // Deep slots hold no fixed relics, so nothing there to grey.
              taken={deep ? NO_FIXED : slottedFixedNames(loadout.slots, index)}
              onChange={(slot) => setSlot(at, slot)}
              onNewRelic={() => setNewRelicAt(isNewHere ? null : at)}
              // While the lines are open the editor carries its own Save and
              // Cancel, so the header only offers the way in.
              onEditLines={
                customRelic && !blank && !editingLines ? () => openEditing(at) : undefined
              }
            />
          </div>
          {editingLines && customRelic ? (
            // Custom relics stay editable line by line, right in the slot.
            <SlotLineEditor
              key={customRelic.id}
              relic={customRelic}
              deep={deep}
              onSave={(edited) => {
                onUpdateCustomRelic(edited);
                closeEditing(at);
              }}
              onCancel={() => closeEditing(at)}
            />
          ) : (
            resolved && (
              <EffectLines
                lines={resolved.lines}
                states={states[index]}
                size="sm"
                className="mt-2 space-y-1"
              />
            )
          )}
          {isNewHere && (
            <CustomRelicEditor
              slotColor={slotColor}
              deep={deep}
              onSave={(relic) => {
                setSlot(at, { kind: "custom", id: addOrReuseRelic(relic) });
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
        {backLabel}
      </button>

      {/* Character first, then chalice and slots follow from it. A saved
          build stays with its Nightfarer — the picker only shows for a new
          one, and switching resets every loadout's chalice to match. */}
      {lockCharacter ? (
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright"
            style={{ borderColor: "#c9a227" }}
          >
            {build.character}
          </span>
          <span className="font-body text-xs text-parchment-faint">
            Builds stay with their Nightfarer — start a new build for another character.
          </span>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {characterChalices.map((c) => {
            const active = c.name === build.character;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() =>
                  patchBuild((b) => {
                    if (b.character === c.name) return b;
                    // Every loadout lands on the new Nightfarer's first
                    // vessel, so every loadout gets refitted to its sockets.
                    const first = chalicesFor(c.name)[0];
                    const onto = (v: VariantView) => ({
                      chalice: first.name,
                      slots: refit(v.slots, first.slots).slots,
                      deepSlots: refit(v.deepSlots, first.deep).slots,
                    });
                    return {
                      ...b,
                      character: c.name,
                      ...onto(b),
                      variants: b.variants?.map((v) => ({ ...v, ...onto(v) })),
                    };
                  })
                }
                aria-pressed={active}
                className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
                  active
                    ? "bg-night-700 text-gold-bright"
                    : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
                }`}
                style={active ? { borderColor: "#c9a227" } : undefined}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Loadout variants — up to MAX_VARIANTS takes on the same build idea,
          each with its own chalice and slots. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {variantCount(build) > 1 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Build variants">
            {Array.from({ length: variantCount(build) }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => switchVariant(i)}
                aria-pressed={i === variant}
                className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                  i === variant
                    ? "bg-night-700 text-gold-bright"
                    : "bg-night-900 text-parchment-muted hover:text-parchment"
                }`}
              >
                {variantLabel(build, i)}
              </button>
            ))}
          </div>
        )}
        {variantCount(build) < MAX_VARIANTS && (
          <button
            type="button"
            onClick={addVariant}
            title="Copy this loadout into a new variant of the same build"
            className="frame rounded-md bg-night-800 px-2.5 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            + Add variant
          </button>
        )}
        {variantCount(build) > 1 && (
          <>
            <input
              type="text"
              value={variant === 0 ? build.variantName ?? "" : build.variants?.[variant - 1]?.name ?? ""}
              onChange={(e) => patchBuild((b) => withVariantLabel(b, variant, e.target.value))}
              placeholder={variantLabel(build, variant)}
              aria-label="Variant name"
              className="frame w-32 rounded bg-night-900 px-2 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint"
            />
            {variant > 0 && (
              <button
                type="button"
                onClick={removeVariant}
                className="frame rounded-md bg-night-800 px-2.5 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-red-300"
              >
                Remove variant
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={build.name}
          onChange={(e) => patchBuild((b) => ({ ...b, name: e.target.value }))}
          placeholder="Build name"
          className="frame w-64 rounded bg-night-900 px-3 py-2 font-display text-lg text-parchment placeholder:text-parchment-faint"
        />
        {/* Swapping chalices keeps every relic the new sockets accept. */}
        <ChalicePicker chalices={chalices} value={chalice} onChange={setChalice} />
        <ScreenshotBuildImport
          chalice={chalice}
          chalices={chalices}
          onApply={applyGroup}
          onSwapChalice={setChalice}
        />
      </div>
      {cleared && (
        <p className="mt-2 font-body text-xs text-red-300/80">
          {cleared.count === 1 ? "1 relic" : `${cleared.count} relics`} didn’t fit {cleared.chalice}
          ’s sockets and {cleared.count === 1 ? "was" : "were"} cleared.
        </p>
      )}
      {duped && (
        <p className="mt-2 font-body text-xs text-red-300/80">
          {duped} is already in another slot — there’s only one in-game, so the second
          scan was kept as a custom relic. Check which slot got misread.
        </p>
      )}

      {/* Tags — pick from your registry, or create one right here. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {store.tags.length > 0 && (
          <MultiSelect
            values={build.tags ?? []}
            options={store.tags.map((t) => ({ value: t, label: t }))}
            onChange={(tags) => patchBuild((b) => ({ ...b, tags }))}
            placeholder="Tags"
            className="w-44"
          />
        )}
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewTag();
            }
          }}
          placeholder="New tag"
          className="frame w-36 rounded bg-night-900 px-2 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={addNewTag}
          disabled={!newTag.trim()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          + Add tag
        </button>
        {(build.tags ?? []).map((t) => (
          <span key={t} className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="eyebrow">Relic Slots</h3>
            <ClearSlotsButton
              filled={loadout.slots.filter(Boolean).length}
              onClear={() => clearSlots(false)}
            />
          </div>
          <div className="space-y-3">{slotSection(false)}</div>
        </section>
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="eyebrow text-gold-dim">Deep of Night Slots</h3>
            <ClearSlotsButton
              filled={loadout.deepSlots.filter(Boolean).length}
              onClear={() => clearSlots(true)}
            />
          </div>
          <div className="space-y-3">{slotSection(true)}</div>
        </section>
      </div>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => onSave(build)} className="frame rounded-md bg-night-700 px-5 py-2 font-body text-sm text-gold-bright hover:bg-night-600">
          Save build
        </button>
        <button type="button" onClick={onCancel} className="frame rounded-md bg-night-800 px-5 py-2 font-body text-sm text-parchment-muted hover:text-parchment">
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * A slotted custom relic's effect lines, edited in place. The lines live in a
 * draft until Save (or Enter) commits them to the pool — the relic is shared
 * with every other build using it, so half-typed lines shouldn't leak out of
 * the slot the way per-keystroke writes did. Save is the editor's own rather
 * than the picker's Done toggle because a relic with no effects yet opens
 * here automatically, with no toggle to commit against.
 */
function SlotLineEditor({
  relic,
  deep,
  onSave,
  onCancel,
}: {
  relic: CustomRelic;
  deep: boolean;
  onSave: (r: CustomRelic) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(relic);
  // Cancel on a relic that's still blank leaves the inputs open (there's
  // nothing to read in their place), so the draft resets rather than lingering.
  const cancel = () => {
    setDraft(relic);
    onCancel();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <RelicLineInputs relic={draft} onUpdate={setDraft} className="mt-2" showDemerits={deep} />
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="submit"
          className="rounded border border-gold-faint px-2 py-0.5 font-body text-xs text-gold-bright hover:bg-night-800"
        >
          Save lines
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-parchment"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Empties a whole slot set — hidden until there's something to empty. */
function ClearSlotsButton({ filled, onClear }: { filled: number; onClear: () => void }) {
  if (filled === 0) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      title="Empty every slot in this set"
      className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted transition-colors hover:border-red-400/60 hover:text-red-300"
    >
      Clear relics
    </button>
  );
}

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
