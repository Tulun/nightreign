"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Advanced filter builder — the visual front end for lib/filterQuery.
//  Two columns, tags and effect text, each with an all / any / none row.
//  Used by both the relic pool and the build list.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import {
  EMPTY_QUERY,
  QUERY_CLAUSES,
  activeClauseCount,
  type ClauseKey,
  type FilterQuery,
} from "@/lib/filterQuery";
import { NORMAL_EFFECT_VOCABULARY } from "@/lib/effectMatch";
import { DEEP_CREATE_VOCABULARY, EffectSuggestInput } from "./shared";

/** Everything an effect line can say, whatever kind of relic it came off. */
const ALL_EFFECTS = Array.from(
  new Set([...NORMAL_EFFECT_VOCABULARY, ...DEEP_CREATE_VOCABULARY]),
).sort();

/**
 * The toolbar button that opens the panel. Separate from the panel itself so
 * the button can sit in a wrapping toolbar row while the panel — which wants
 * the full width — renders beneath it. The count keeps a query that's still
 * narrowing the list visible once the panel is closed again.
 */
export function FilterToggle({
  query,
  open,
  onToggle,
}: {
  query: FilterQuery;
  open: boolean;
  onToggle: () => void;
}) {
  const active = activeClauseCount(query);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
        open || active > 0
          ? "bg-night-700 text-gold-bright"
          : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
      }`}
    >
      Advanced filter
      {active > 0 && <span className="ml-1.5 font-body text-xs">({active})</span>}
    </button>
  );
}

/**
 * The builder itself — tags down one side, effect text down the other, and
 * the caller renders describeQuery's summary next to its results.
 */
export function FilterPanel({
  query,
  onChange,
  tags,
  noun,
  onManageTags,
}: {
  query: FilterQuery;
  onChange: (q: FilterQuery) => void;
  /** The tag registry this filter picks from (build tags or relic keywords). */
  tags: string[];
  /** What's being filtered, for the empty-registry hint. */
  noun: "build" | "relic";
  /** Opens the tag manager, when the caller has one. */
  onManageTags?: () => void;
}) {
  const active = activeClauseCount(query);
  const set = (key: ClauseKey, values: string[]) => onChange({ ...query, [key]: values });

  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div className="space-y-3">
          <h4 className="eyebrow text-gold-dim">Tags</h4>
          {tags.length === 0 ? (
            <p className="font-body text-xs text-parchment-faint">
              No tags yet — add them on a {noun} card
              {onManageTags && (
                <>
                  , or{" "}
                  <button
                    type="button"
                    onClick={onManageTags}
                    className="text-parchment-muted underline hover:text-gold-bright"
                  >
                    manage the list
                  </button>
                </>
              )}
              .
            </p>
          ) : (
            QUERY_CLAUSES.filter((c) => c.field === "tags").map((c) => (
              <label key={c.key} className="flex items-center gap-2">
                <span className="w-28 shrink-0 font-body text-xs text-parchment-muted">
                  {c.label}
                </span>
                <MultiSelect
                  values={query[c.key]}
                  options={tags.map((t) => ({ value: t, label: t }))}
                  onChange={(v) => set(c.key, v)}
                  placeholder="Any"
                  className="min-w-0 flex-1"
                  showValues
                />
              </label>
            ))
          )}
        </div>
        <div className="space-y-3">
          <h4 className="eyebrow text-gold-dim">Effects</h4>
          {QUERY_CLAUSES.filter((c) => c.field === "effects").map((c) => (
            <div key={c.key} className="flex items-start gap-2">
              <span className="w-28 shrink-0 pt-1.5 font-body text-xs text-parchment-muted">
                {c.label}
              </span>
              <TermInput values={query[c.key]} onChange={(v) => set(c.key, v)} label={c.label} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_QUERY, text: query.text })}
          disabled={active === 0 || (active === 1 && !!query.text.trim())}
          className="frame rounded-md bg-night-800 px-3 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          Clear filter
        </button>
        {onManageTags && tags.length > 0 && (
          <button
            type="button"
            onClick={onManageTags}
            className="frame rounded-md bg-night-800 px-3 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Manage tags
          </button>
        )}
        <p className="font-body text-xs text-parchment-faint">
          Every filled row has to hold — effects match any part of a line.
        </p>
      </div>
    </section>
  );
}

/**
 * A list of effect searches as removable chips, with a suggesting input to
 * add the next one. Typed text is a substring search, so a partial line is a
 * perfectly good term — the suggestions are a convenience, not a vocabulary.
 */
function TermInput({
  values,
  onChange,
  label,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const term = draft.trim();
    if (!term) return;
    if (!values.some((v) => v.toLowerCase() === term.toLowerCase())) onChange([...values, term]);
    setDraft("");
  };
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <EffectSuggestInput
          value={draft}
          onChange={setDraft}
          onEnter={add}
          vocab={ALL_EFFECTS}
          placeholder="Effect text…"
          className="frame min-w-0 flex-1 rounded bg-night-900 px-2 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label={`Add to ${label}`}
          className="frame rounded-md bg-night-800 px-2 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          +
        </button>
      </div>
      {values.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {values.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                title={`Remove “${v}”`}
                className="flex items-center gap-1 rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted hover:border-red-400/60 hover:text-red-300"
              >
                {v}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
