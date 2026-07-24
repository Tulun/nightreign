"use client";

import Image from "next/image";
import { useState } from "react";
import { CHALICE_CREDIT, characterChalices, grailChalices } from "@/data/chalices";
import { asset } from "@/lib/assets";
import { SLOT_ICON, deepDiffers, type Chalice, type SlotColor } from "@/lib/chalices";

/**
 * Per-Nightfarer chalice browser: pick a character to list their vessels in
 * game order, with each one's relic slots and its Deep of Night layout.
 * The all-Nightfarer grails follow at the bottom.
 */
export function Chalices() {
  const [name, setName] = useState(characterChalices[0].name);
  const character = characterChalices.find((c) => c.name === name) ?? characterChalices[0];

  return (
    <div>
      {/* Character selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {characterChalices.map((c) => {
          const active = c.name === name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setName(c.name)}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {character.chalices.map((chalice) => (
          <ChaliceCard key={chalice.name} chalice={chalice} />
        ))}
      </div>

      <h3 className="mt-8 font-display text-2xl font-bold text-parchment">Grails</h3>
      <p className="mt-1 max-w-prose font-body text-sm text-parchment-muted">
        Single-color grails every Nightfarer can equip.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {grailChalices.map((chalice) => (
          <ChaliceCard key={chalice.name} chalice={chalice} />
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">
        The white slot is universal — it accepts a relic of any color. {CHALICE_CREDIT}.
      </p>
    </div>
  );
}

function ChaliceCard({ chalice }: { chalice: Chalice }) {
  const changed = deepDiffers(chalice);
  return (
    <article className="frame flex flex-col rounded-md bg-night-800 p-4">
      <h4 className="font-display font-semibold text-parchment">{chalice.name}</h4>
      <div className="mt-2 space-y-1.5">
        <SlotRow label="Slots" slots={chalice.slots} />
        <SlotRow label="Deep of Night" slots={chalice.deep} highlight={changed} />
      </div>
      <p className="mt-auto pt-2 font-body text-xs text-parchment-faint">{chalice.source}</p>
    </article>
  );
}

function SlotRow({ label, slots, highlight }: { label: string; slots: SlotColor[]; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-28 shrink-0 font-body text-xs ${highlight ? "text-gold-dim" : "text-parchment-faint"}`}>
        {label}
      </span>
      <span className="flex items-center gap-1">
        {slots.map((slot, i) => (
          <Image
            key={`${slot}-${i}`}
            src={asset(SLOT_ICON[slot])}
            alt={slot}
            title={slot}
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        ))}
      </span>
    </div>
  );
}
