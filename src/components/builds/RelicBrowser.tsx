"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Slot pickers: the inline RelicPicker each slot renders, and the
//  full-screen RelicBrowser modal it opens.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  customRelicIcon,
  fixedRelicsFor,
  type BuildSlot,
  type BuildStore,
  type FixedRelicOption,
} from "@/lib/builds";
import type { SlotColor } from "@/lib/chalices";
import { soloEffectStates } from "@/lib/effectCompat";
import { resolveSlot, EffectLines, RelicImg, SlotIconImg, type ResolvedLine } from "./shared";

export function RelicPicker({
  character,
  slotColor,
  deep,
  store,
  value,
  onChange,
  onNewRelic,
  onEditLines,
}: {
  character: string;
  slotColor: SlotColor;
  deep: boolean;
  store: BuildStore;
  value: BuildSlot;
  onChange: (slot: BuildSlot) => void;
  onNewRelic: () => void;
  /**
   * Given for a slot whose relic can have its lines edited in place, and only
   * while they're closed — the open editor carries its own Save and Cancel.
   */
  onEditLines?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const resolved = resolveSlot(value, store);

  return (
    <div className="min-w-0 flex-1">
      {resolved ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-body text-base text-parchment">{resolved.name}</span>
          {onEditLines && (
            <button
              type="button"
              onClick={onEditLines}
              title="Edit this relic's effect lines"
              className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted transition-colors hover:text-gold-bright"
            >
              Edit lines
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
          >
            Swap
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ) : (
        // An empty slot offers its two paths outright: create a relic, or
        // pick one from the pool/game list.
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNewRelic}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            + Add new relic
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            Load relic…
          </button>
        </div>
      )}
      {open && (
        <RelicBrowser
          character={character}
          slotColor={slotColor}
          deep={deep}
          store={store}
          value={value}
          onPick={(slot) => {
            onChange(slot);
            setOpen(false);
          }}
          onNewRelic={() => {
            setOpen(false);
            onNewRelic();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** The fixed-relic groupings shown as tables in the browser. */
const FIXED_SECTIONS: { key: "nightlord" | "other"; title: string; groups: FixedRelicOption["group"][] }[] = [
  { key: "nightlord", title: "Nightlord Relics", groups: ["nightlord", "everdark"] },
  { key: "other", title: "Remembrance & Other", groups: ["swap", "character", "shop", "boss"] },
];

const BROWSER_TABS = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Relics" },
  { key: "nightlord", label: "Nightlord" },
  { key: "other", label: "Remembrance & Other" },
] as const;
type BrowserTab = (typeof BROWSER_TABS)[number]["key"];

/**
 * Order within "Remembrance & Other": the current character's stat swaps,
 * then their Remembrance relics, then all-Nightfarer relics, then other
 * characters' — so a Nightfarer's own gear floats to the top.
 */
function rankOtherSection(r: FixedRelicOption, character: string): number {
  if (r.character === character) return r.group === "swap" ? 0 : 1;
  return !r.character ? 2 : 3;
}

/**
 * Full-screen modal relic browser: relics that fit the slot shown as cards
 * with every effect line visible, so similar relics can be told apart at a
 * glance. Search covers names, effects, and character.
 */
function RelicBrowser({
  character,
  slotColor,
  deep,
  store,
  value,
  onPick,
  onNewRelic,
  onClose,
}: {
  character: string;
  slotColor: SlotColor;
  deep: boolean;
  store: BuildStore;
  value: BuildSlot;
  onPick: (slot: BuildSlot) => void;
  onNewRelic: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<BrowserTab>("all");

  // The page behind the modal shouldn't scroll while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fixed = fixedRelicsFor(character, slotColor, deep);
  // Only relics of the slot's kind fit: deep slots take Deep relics, normal
  // slots take normal ones — same as in-game.
  const custom = store.customRelics.filter(
    (r) => !!r.deep === deep && (slotColor === "White" || r.color === slotColor),
  );
  const query = q.trim().toLowerCase();
  const matches = (name: string, effects: string[], char?: string) =>
    !query ||
    name.toLowerCase().includes(query) ||
    (char ?? "").toLowerCase().includes(query) ||
    effects.some((e) => e.toLowerCase().includes(query));
  const filteredCustom = custom.filter((r) => matches(r.name || `${r.color} relic`, r.effects));
  const filteredFixed = fixed.filter((r) => matches(r.name, r.effects, r.character));

  const showCustom = tab === "all" || tab === "mine";
  const visibleSections = FIXED_SECTIONS.filter((s) => tab === "all" || tab === s.key)
    .map((s) => {
      const rows = filteredFixed.filter((r) => s.groups.includes(r.group));
      if (s.key === "other") {
        rows.sort(
          (a, b) =>
            rankOtherSection(a, character) - rankOtherSection(b, character) ||
            a.name.localeCompare(b.name),
        );
      }
      return { ...s, rows };
    })
    .filter((s) => s.rows.length > 0);

  const customShown = showCustom ? filteredCustom : [];
  const pickFirst = () => {
    const firstFixed = visibleSections[0]?.rows[0];
    if (customShown[0]) onPick({ kind: "custom", id: customShown[0].id });
    else if (firstFixed) onPick({ kind: "fixed", name: firstFixed.name });
  };

  // Stretched rather than items-start: cards in a row end level, so the grid
  // reads as rows of relics instead of a ragged stack.
  const cardGrid = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a relic"
        className="relative flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-night-500 bg-night-850 shadow-lift"
      >
        <div className="flex items-center gap-2 border-b border-night-600 px-4 py-3">
          <SlotIconImg color={slotColor} size={22} />
          <h3 className="font-display text-lg font-semibold text-parchment">
            Choose a relic
            <span className="ml-2 font-body text-xs font-normal text-parchment-faint">
              {slotColor === "White" ? "any color fits" : `${slotColor} slot`}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-night-600 px-4 py-2.5">
          <input
            type="text"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pickFirst();
            }}
            placeholder="Search relics or effects…"
            className="frame min-w-48 flex-1 rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onPick(null)}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Empty the slot
          </button>
          <button
            type="button"
            onClick={onNewRelic}
            className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
          >
            + New custom relic…
          </button>
        </div>

        {/* Section tabs — deep slots only ever hold custom relics, so the
            fixed-relic tabs would all be empty there. */}
        <div className={`flex flex-wrap gap-1.5 border-b border-night-600 px-4 py-2 ${deep ? "hidden" : ""}`}>
          {BROWSER_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={active}
                className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                  active
                    ? "bg-night-700 text-gold-bright"
                    : "bg-night-900 text-parchment-muted hover:bg-night-800 hover:text-parchment"
                }`}
                style={active ? { borderColor: "#c9a227" } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto p-4">
          {customShown.length > 0 && (
            <>
              <p className="eyebrow mb-2">My relics</p>
              <div className={cardGrid}>
                {customShown.map((r) => (
                  <RelicBrowserCard
                    key={r.id}
                    name={r.name || `${r.color} relic`}
                    icon={customRelicIcon(r)}
                    lines={r.effects
                      .map((text, i) => ({ text, demerit: r.demerits?.[i]?.trim() || undefined }))
                      .filter((l) => l.text.trim())}
                    character={character}
                    active={value?.kind === "custom" && value.id === r.id}
                    onClick={() => onPick({ kind: "custom", id: r.id })}
                  />
                ))}
              </div>
            </>
          )}
          {visibleSections.map(({ title, rows }) => (
            <div key={title} className="mt-4 first:mt-0">
              <p className="eyebrow mb-1.5">{title}</p>
              <FixedRelicTable relics={rows} character={character} value={value} onPick={onPick} />
            </div>
          ))}
          {customShown.length === 0 && visibleSections.length === 0 && (
            <p className="py-6 text-center font-body text-sm text-parchment-faint">
              {query ? (
                <>Nothing matches “{q}”.</>
              ) : deep ? (
                "Deep of Night relics are all custom rolls — add yours with “+ New custom relic”."
              ) : (
                "Nothing here for this slot."
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fixed relics as table rows — name column plus effects, one relic per row. */
function FixedRelicTable({
  relics,
  character,
  value,
  onPick,
}: {
  relics: FixedRelicOption[];
  character: string;
  value: BuildSlot;
  onPick: (slot: BuildSlot) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {relics.map((r) => {
          const active = value?.kind === "fixed" && value.name === r.name;
          return (
            <tr
              key={r.name}
              tabIndex={0}
              onClick={() => onPick({ kind: "fixed", name: r.name })}
              onKeyDown={(e) => {
                if (e.key === "Enter") onPick({ kind: "fixed", name: r.name });
              }}
              className={`cursor-pointer border-b border-night-700 transition-colors last:border-b-0 ${
                active ? "bg-night-700" : "hover:bg-night-800"
              }`}
            >
              {/* A name needs far less room than three effect lines do, so the
                  name column is sized to the longest relic name rather than to
                  a share of the table — the rest goes to the effects. */}
              <td className="w-[38%] min-w-40 py-2.5 pl-1 pr-4 align-top sm:w-[1%] sm:min-w-52 sm:whitespace-nowrap">
                <span className="flex items-center gap-2">
                  <RelicImg src={r.icon} alt="" size={28} />
                  <span className={`font-body text-base ${active ? "text-gold-bright" : "text-parchment"}`}>
                    {r.name}
                  </span>
                  {r.character && r.character !== character && (
                    <span className="shrink-0 rounded border border-night-600 px-1 font-body text-[0.65rem] text-parchment-faint">
                      {r.character}
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2.5 pr-1 align-top">
                {/* Greyed here as well as on the build — a relic whose pull
                    is an effect for someone else is worth spotting before
                    it's slotted, not after. */}
                <EffectLines
                  lines={r.effects.map((text) => ({ text }))}
                  states={soloEffectStates(character, r.effects)}
                  size="sm"
                  className="space-y-0.5"
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RelicBrowserCard({
  name,
  icon,
  tag,
  lines,
  character,
  active,
  onClick,
}: {
  name: string;
  icon: string;
  tag?: string;
  lines: ResolvedLine[];
  /** Nightfarer the relic is being picked for — greys what won't apply. */
  character: string;
  active: boolean;
  onClick: () => void;
}) {
  // flex-col: a button centres its content, which would float a short card's
  // title away from the top once its row stretches to a common height.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`frame flex h-full w-full flex-col items-stretch rounded-md p-3 text-left transition-colors ${
        active ? "bg-night-700" : "bg-night-800 hover:bg-night-700"
      }`}
      style={active ? { borderColor: "#c9a227" } : undefined}
    >
      <span className="flex items-center gap-2">
        <RelicImg src={icon} alt="" size={28} />
        <span className={`font-body text-base ${active ? "text-gold-bright" : "text-parchment"}`}>{name}</span>
        {tag && (
          <span className="rounded border border-night-600 px-1 font-body text-[0.65rem] text-parchment-faint">{tag}</span>
        )}
      </span>
      <EffectLines
        lines={lines}
        states={soloEffectStates(character, lines.map((l) => l.text))}
        size="sm"
        divided
        className="mt-2"
      />
    </button>
  );
}
