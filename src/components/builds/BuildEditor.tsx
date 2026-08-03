"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Editor view: full-width build editor with searchable relic pickers,
//  Deep of Night slots, and tags. Screenshots are read in the Import view,
//  which assembles a whole build in one pass — this view is for working on a
//  build that already exists.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { characterChalices } from "@/data/chalices";
import { MultiSelect } from "@/components/MultiSelect";
import {
  EMPTY_SLOTS,
  LIMITS,
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
import {
  chalicesFor,
  resolveSlot,
  CharacterImg,
  CharacterTile,
  EffectLines,
  RelicLineInputs,
  SlotIconImg,
  StepTrail,
  lineGapError,
  type SlotRef,
} from "./shared";

/** Stable empty set for slots that can't hold a fixed relic in the first place. */
const NO_FIXED: Set<string> = new Set();

/**
 * A new build's flow, in order. The Nightfarer decides which vessels exist and
 * what colors their sockets are, so everything on the second step is read
 * against it — asking for it first is one tap, where a picker sitting above
 * six sockets is a decision you can miss until the relics are already wrong.
 * A saved build skips the flow: its Nightfarer is settled (see lockCharacter).
 */
const STEP_LABELS = ["Nightfarer", "Build"] as const;

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
  onImportBuild,
}: {
  initial: Build;
  store: BuildStore;
  onSave: (b: Build) => void;
  onCancel: () => void;
  /** Where leaving the editor goes back to — the list, or the build's page. */
  backLabel?: string;
  /** Saved builds keep their Nightfarer — only a new build picks one. */
  lockCharacter?: boolean;
  /** Leave for the build importer — offered on a new build, which is where
      "I have screenshots, not a filled pool" comes up. It lands on the build
      importer rather than the relic one: that reads the relics *and* the build
      in one go, so the trip out ends where this flow was headed anyway. */
  onImportBuild?: () => void;
  onAddCustomRelic: (r: CustomRelic) => void;
  onUpdateCustomRelic: (r: CustomRelic) => void;
  onCreateTag: (name: string) => void;
}) {
  const [build, setBuild] = useState<Build>(initial);
  const patchBuild = (fn: (b: Build) => Build) => setBuild(fn);
  // A new build asks for its Nightfarer on a step of its own; a saved build
  // keeps the one it has, so it opens straight into the slots.
  const [step, setStep] = useState<"character" | "build">(lockCharacter ? "build" : "character");
  // Whether the Nightfarer on the draft was chosen here. A new build arrives
  // seeded with one so the slots have sockets to draw — that seed isn't an
  // answer to step 1, and shouldn't read as one.
  const [pickedCharacter, setPickedCharacter] = useState(false);
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
  };

  /** This loadout's slots re-checked against a chalice's socket colors. */
  const refit = (slots: SlotTriple, colors: readonly SlotColor[]) =>
    slotsForColors(slots, colors, store);

  // Step 1's answer. Every loadout lands on the new Nightfarer's first vessel
  // — vessels belong to a character, so the old pick can't carry across — and
  // so every loadout gets refitted to that vessel's sockets. Coming back to
  // change it after some slots are filled keeps whatever the new sockets still
  // accept, the same as swapping vessels does.
  const pickCharacter = (name: string) => {
    patchBuild((b) => {
      if (b.character === name) return b;
      const first = chalicesFor(name)[0];
      const onto = (v: VariantView) => ({
        chalice: first.name,
        slots: refit(v.slots, first.slots).slots,
        deepSlots: refit(v.deepSlots, first.deep).slots,
      });
      return {
        ...b,
        character: name,
        ...onto(b),
        variants: b.variants?.map((v) => ({ ...v, ...onto(v) })),
      };
    });
    setPickedCharacter(true);
    setCleared(null);
    setStep("build");
  };

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
  // relic created twice (or owned twice) is one pool entry slotted twice. The
  // ref also covers relics made moments ago, before the parent's state update
  // has come back around.
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

  const filledSlots = [...loadout.slots, ...loadout.deepSlots].filter(Boolean).length;

  // ── Step 1: who the build is for ───────────────────────────────────────
  if (step === "character") {
    return (
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="frame mb-4 rounded-md bg-night-800 px-4 py-2.5 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          {backLabel}
        </button>
        <StepTrail steps={STEP_LABELS} at={0} />

        {/* What this flow builds from, and the way out for someone who has
            screenshots rather than a pool to pick from. */}
        {onImportBuild && (
          <p className="mb-5 max-w-prose font-body text-base text-parchment-muted">
            Create a build from relics you have in your relic pool. If you&rsquo;d rather read a
            whole build off screenshots,{" "}
            <button
              type="button"
              onClick={onImportBuild}
              className="font-semibold text-gold-bright underline underline-offset-2 hover:text-parchment"
            >
              click here
            </button>
            .
          </p>
        )}

        <section>
          <h4 className="font-display text-lg text-parchment">Who are you building for?</h4>
          <p className="mt-1 max-w-prose font-body text-base text-parchment-muted">
            Vessels and their sockets are per-Nightfarer, so this comes first — the relics you can
            slot next are the ones this character&rsquo;s vessel has room for.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {characterChalices.map((c) => (
              <CharacterTile
                key={c.name}
                name={c.name}
                // Highlighted only once it's an answer — coming back through
                // "Change", rather than the Nightfarer the draft was seeded
                // with before anyone chose anything.
                active={pickedCharacter && c.name === build.character}
                onPick={() => pickCharacter(c.name)}
              />
            ))}
          </div>
          {filledSlots > 0 && (
            <p className="mt-3 max-w-prose font-body text-base text-gold-dim">
              Changing the Nightfarer moves the build to that character&rsquo;s first vessel — relics
              its sockets don&rsquo;t take are cleared, the same as swapping vessels.
            </p>
          )}
        </section>
      </div>
    );
  }

  // ── Step 2: the build itself ───────────────────────────────────────────
  return (
    <div>
      {lockCharacter ? (
        <button type="button" onClick={onCancel} className="mb-4 font-body text-sm text-parchment-muted hover:text-gold-bright">
          {backLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStep("character")}
          className="frame mb-4 rounded-md bg-night-800 px-4 py-2.5 font-body text-base text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          ← Back to Nightfarer
        </button>
      )}
      {!lockCharacter && <StepTrail steps={STEP_LABELS} at={1} />}

      {/* Who it's for. A saved build stays with its Nightfarer; a new one
          shows what step 1 answered, changeable by going back to it. */}
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
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <CharacterImg name={build.character} size={28} />
          <span className="font-display text-lg text-parchment">{build.character}</span>
          <button
            type="button"
            onClick={() => setStep("character")}
            className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:border-gold-faint hover:text-gold-bright"
          >
            Change
          </button>
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
              maxLength={LIMITS.buildName}
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
          maxLength={LIMITS.buildName}
          className="frame w-64 rounded bg-night-900 px-3 py-2 font-display text-lg text-parchment placeholder:text-parchment-faint"
        />
        {/* Swapping chalices keeps every relic the new sockets accept. */}
        <ChalicePicker chalices={chalices} value={chalice} onChange={setChalice} />
      </div>
      {cleared && (
        <p className="mt-2 font-body text-xs text-red-300/80">
          {cleared.count === 1 ? "1 relic" : `${cleared.count} relics`} didn’t fit {cleared.chalice}
          ’s sockets and {cleared.count === 1 ? "was" : "were"} cleared.
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
          maxLength={LIMITS.tag}
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
        // A move can leave a gap in the lines; the note under them says so,
        // and this is where it stops being saveable.
        if (lineGapError(draft.effects)) return;
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
