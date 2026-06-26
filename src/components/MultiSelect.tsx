"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface MultiOption {
  value: string;
  label: string;
}

interface MenuPos { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

/**
 * Dark-themed multi-select dropdown matching Dropdown.tsx. The trigger shows the
 * selection count; the portal menu has a "Clear" action and a checkbox per
 * option. `values` is the selected list; empty = none selected (treat as "all").
 */
export function MultiSelect({
  values,
  options,
  onChange,
  placeholder = "All",
  className = "",
}: {
  values: string[];
  options: MultiOption[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function reposition() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const margin = 8;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    setPos({
      left: r.left,
      width: r.width,
      maxHeight: Math.min(320, (openUp ? spaceAbove : spaceBelow) - margin),
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      reposition();
    };
    const onResize = () => setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const set = new Set(values);
  const toggle = (v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  };

  const label = values.length === 0 ? placeholder : `${values.length} selected`;

  const menu = open && pos && typeof document !== "undefined" && createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-multiselectable="true"
      style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
      className="z-50 overflow-auto rounded-lg border border-night-600 bg-night-850 p-1 shadow-lift"
    >
      <button
        type="button"
        onClick={() => onChange([])}
        disabled={values.length === 0}
        className="block w-full rounded px-2 py-1.5 text-left font-body text-sm text-parchment-muted transition-colors hover:bg-night-700 hover:text-parchment disabled:opacity-40 disabled:hover:bg-transparent"
      >
        Clear {values.length > 0 ? `(${values.length})` : ""}
      </button>
      {options.map((o) => {
        const on = set.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => toggle(o.value)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-body text-sm transition-colors ${
              on ? "text-gold-bright" : "text-parchment-muted hover:bg-night-700 hover:text-parchment"
            }`}
          >
            <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-gold bg-gold/15" : "border-night-600"}`}>
              {on && (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold-bright" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">{o.label}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-left font-body text-sm transition-colors hover:border-night-500 focus:border-gold-faint focus:outline-none ${values.length ? "text-parchment" : "text-parchment-faint"}`}
      >
        <span className="truncate">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          {values.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="grid h-4 w-4 place-items-center rounded text-parchment-faint hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          )}
          <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-parchment-faint transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  );
}
