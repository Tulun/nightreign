"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Tagging from a card: the chips a build or relic carries, each removable,
//  plus a popover for putting more on (and inventing one on the spot).
//  Used on the build tiles and on the relic pool cards, so tags don't mean a
//  trip through the editor.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

/**
 * Editable tag chips. `registry` is the tag list to pick from and `onCreate`
 * adds a name to it — the picker assigns whatever it creates, so a tag can be
 * born and applied in one go.
 */
export function TagPicker({
  values,
  registry,
  onChange,
  onCreate,
  subject,
}: {
  values: string[];
  registry: string[];
  onChange: (tags: string[]) => void;
  onCreate: (tag: string) => void;
  /** Names the thing being tagged, for the labels a screen reader reads out. */
  subject: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (tag: string) =>
    onChange(values.includes(tag) ? values.filter((t) => t !== tag) : [...values, tag].sort());

  const create = () => {
    const tag = draft.trim();
    if (!tag) return;
    onCreate(tag);
    if (!values.includes(tag)) onChange([...values, tag].sort());
    setDraft("");
  };

  // Registry entries this thing doesn't carry yet, then the ones it does —
  // what's on offer reads first, what's already applied stays togglable.
  const unused = registry.filter((t) => !values.includes(t));

  return (
    <div ref={wrap} className="relative flex flex-wrap items-center gap-1">
      {values.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => toggle(t)}
          title={`Remove “${t}” from ${subject}`}
          className="flex items-center gap-1 rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted transition-colors hover:border-red-400/60 hover:text-red-300"
        >
          {t}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Tag ${subject}`}
        title={`Tag ${subject}`}
        className={`rounded border px-1.5 py-0.5 font-body text-xs transition-colors ${
          open
            ? "border-gold-faint bg-night-900 text-gold-bright"
            : "border-dashed border-night-600 text-parchment-faint hover:border-gold-faint hover:text-gold-bright"
        }`}
      >
        + Tag
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-night-600 bg-night-850 p-1.5 shadow-lift">
          {registry.length > 0 && (
            <ul className="max-h-44 overflow-auto">
              {[...unused, ...values.filter((t) => registry.includes(t))].map((t) => {
                const on = values.includes(t);
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => toggle(t)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left font-body text-sm transition-colors ${
                        on ? "text-gold-bright" : "text-parchment-muted hover:bg-night-700 hover:text-parchment"
                      }`}
                    >
                      <span
                        className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[10px] ${
                          on ? "border-gold bg-gold/15" : "border-night-600"
                        }`}
                      >
                        {on && "✓"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-1 flex items-center gap-1 border-t border-night-700 pt-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
              placeholder="New tag"
              aria-label="New tag"
              className="frame min-w-0 flex-1 rounded bg-night-900 px-2 py-1 font-body text-xs text-parchment placeholder:text-parchment-faint"
            />
            <button
              type="button"
              onClick={create}
              disabled={!draft.trim()}
              className="frame rounded bg-night-800 px-2 py-1 font-body text-xs text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
