"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StatIcon } from "@/components/StatIcon";

export interface DropdownOption {
  value: string;
  label: string;
  group?: string;
  /** Optional leading icon (e.g. element affinity symbol). */
  icon?: string;
}

interface MenuPos { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

/**
 * Dark-themed dropdown matching the app CSS (native <select> popups can't be
 * styled). The menu renders in a portal with fixed positioning so it overlays
 * the page instead of growing it, and flips above the trigger near the bottom.
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select…",
  clearable = true,
  searchable = false,
  tone = "default",
  className = "",
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  clearable?: boolean;
  searchable?: boolean;
  tone?: "default" | "curse";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
      maxHeight: Math.min(288, (openUp ? spaceAbove : spaceBelow) - margin),
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open]);

  useEffect(() => {
    if (!open) { setQuery(""); return; }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Reposition on page scroll, but ignore scrolling inside the menu itself.
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

  const selected = options.find((o) => o.value === value);
  const ql = query.trim().toLowerCase();
  const shown = ql ? options.filter((o) => o.label.toLowerCase().includes(ql)) : options;
  const groups: { group?: string; opts: DropdownOption[] }[] = [];
  for (const o of shown) {
    const g = groups.find((x) => x.group === o.group);
    if (g) g.opts.push(o);
    else groups.push({ group: o.group, opts: [o] });
  }

  const border = tone === "curse" ? "border-red-500/40" : "border-night-600";

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  const menu = open && pos && typeof document !== "undefined" && createPortal(
    <div
      ref={menuRef}
      role="listbox"
      style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
      className="z-50 overflow-auto rounded-lg border border-night-600 bg-night-850 p-1 shadow-lift"
    >
      {searchable && (
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="mb-1 w-full rounded border border-night-600 bg-night-900 px-2 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
      )}
      {clearable && (
        <button type="button" onClick={() => pick("")} className={`block w-full rounded px-2 py-1.5 text-left font-body text-sm transition-colors ${value === "" ? "bg-night-700 text-gold-bright" : "text-parchment-muted hover:bg-night-700 hover:text-parchment"}`}>
          {placeholder}
        </button>
      )}
      {shown.length === 0 && <p className="px-2 py-2 font-body text-sm text-parchment-faint">No matches.</p>}
      {groups.map((grp, i) => (
        <div key={i}>
          {grp.group && (
            <p className="px-2 pb-0.5 pt-2 font-body text-[0.6rem] font-semibold uppercase tracking-wide text-sky-300/70">{grp.group}</p>
          )}
          {grp.opts.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => pick(o.value)}
              className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-body text-sm transition-colors ${
                o.value === value ? "bg-night-700 text-gold-bright" : "text-parchment-muted hover:bg-night-700 hover:text-parchment"
              }`}
            >
              {o.icon && <StatIcon src={o.icon} alt="" size={14} />}
              <span className="min-w-0 flex-1">{o.label}</span>
            </button>
          ))}
        </div>
      ))}
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
        className={`flex w-full items-center justify-between gap-2 rounded-lg border ${border} bg-night-900 px-3 py-2 text-left font-body text-sm transition-colors hover:border-night-500 focus:border-gold-faint focus:outline-none ${selected ? "text-parchment" : "text-parchment-faint"}`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected?.icon && <StatIcon src={selected.icon} alt="" size={14} />}
          {selected?.label ?? placeholder}
        </span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 text-parchment-faint transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {menu}
    </div>
  );
}
