"use client";

import { useEffect, useRef, useState } from "react";
import { StatIcon } from "@/components/StatIcon";

export interface DropdownOption {
  value: string;
  label: string;
  group?: string;
  /** Optional leading icon (e.g. element affinity symbol). */
  icon?: string;
}

/**
 * Dark-themed dropdown that matches the app CSS (native <select> popups can't
 * be styled). Supports optgroup-style grouping and an optional clear entry.
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select…",
  clearable = true,
  tone = "default",
  className = "",
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  clearable?: boolean;
  tone?: "default" | "curse";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const groups: { group?: string; opts: DropdownOption[] }[] = [];
  for (const o of options) {
    const g = groups.find((x) => x.group === o.group);
    if (g) g.opts.push(o);
    else groups.push({ group: o.group, opts: [o] });
  }

  const border = tone === "curse" ? "border-red-500/40" : "border-night-600";

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
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

      {open && (
        <div role="listbox" className="absolute left-0 z-30 mt-1 max-h-72 w-max min-w-full max-w-[min(90vw,26rem)] overflow-auto rounded-lg border border-night-600 bg-night-850 p-1 shadow-lift">
          {clearable && (
            <button type="button" onClick={() => pick("")} className={`block w-full rounded px-2 py-1.5 text-left font-body text-sm transition-colors ${value === "" ? "bg-night-700 text-gold-bright" : "text-parchment-muted hover:bg-night-700 hover:text-parchment"}`}>
              {placeholder}
            </button>
          )}
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
                  {o.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
