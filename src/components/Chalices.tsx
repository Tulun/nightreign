"use client";

import Image from "next/image";
import { useState } from "react";
import { CHALICE_CREDIT, characterChalices, grailChalices } from "@/data/chalices";
import { asset } from "@/lib/assets";
import { SLOT_ICON, deepDiffers, type Chalice, type SlotColor } from "@/lib/chalices";

/**
 * Per-Nightfarer chalice browser: pick a character to list their vessels in
 * game order, with each one's relic slots and its Deep of Night layout.
 * Desktop shows both layouts side by side; mobile shows one at a time with
 * a Normal/Deep toggle to keep the cards short. The all-Nightfarer grails
 * follow at the bottom.
 */
export function Chalices() {
  const [name, setName] = useState(characterChalices[0].name);
  const [mobileDeep, setMobileDeep] = useState(false);
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

      {/* Mobile-only: flip every card between normal and Deep of Night slots */}
      <div className="mb-3 flex items-center gap-1 sm:hidden">
        {([false, true] as const).map((isDeep) => (
          <button
            key={String(isDeep)}
            type="button"
            onClick={() => setMobileDeep(isDeep)}
            aria-pressed={mobileDeep === isDeep}
            className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              mobileDeep === isDeep
                ? "bg-night-700 text-gold-bright"
                : "bg-night-800 text-parchment-muted hover:text-parchment"
            }`}
          >
            {isDeep ? "Deep of Night" : "Normal"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {character.chalices.map((chalice) => (
          <ChaliceCard key={chalice.name} chalice={chalice} mobileDeep={mobileDeep} />
        ))}
      </div>

      <h3 className="mt-8 font-display text-2xl font-bold text-parchment">Grails</h3>
      <p className="mt-1 max-w-prose font-body text-sm text-parchment-muted">
        Single-color grails every Nightfarer can equip.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {grailChalices.map((chalice) => (
          <ChaliceCard key={chalice.name} chalice={chalice} mobileDeep={mobileDeep} />
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">
        The white slot is universal — it accepts a relic of any color. {CHALICE_CREDIT}.
      </p>
    </div>
  );
}

function ChaliceCard({ chalice, mobileDeep }: { chalice: Chalice; mobileDeep: boolean }) {
  const changed = deepDiffers(chalice);
  return (
    <article className="frame flex flex-col rounded-md bg-night-800 p-4">
      <h4 className="font-display font-semibold text-parchment">{chalice.name}</h4>

      {/* Desktop: normal and Deep of Night side by side */}
      <div className="mt-2 hidden items-end gap-3 sm:flex">
        <SlotGroup label="Slots" slots={chalice.slots} />
        <span className="mb-1 h-5 w-px shrink-0 bg-night-600" aria-hidden="true" />
        <SlotGroup label="Deep of Night" slots={chalice.deep} highlight={changed} />
      </div>

      {/* Mobile: one layout at a time, driven by the page-level toggle */}
      <div className="mt-2 sm:hidden">
        <SlotIcons slots={mobileDeep ? chalice.deep : chalice.slots} />
      </div>

      <p className="mt-auto pt-2 font-body text-xs text-parchment-faint">{chalice.source}</p>
    </article>
  );
}

function SlotGroup({ label, slots, highlight }: { label: string; slots: SlotColor[]; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`font-body text-[10px] leading-none ${highlight ? "text-gold-dim" : "text-parchment-faint"}`}>
        {label}
      </span>
      <SlotIcons slots={slots} />
    </div>
  );
}

function SlotIcons({ slots }: { slots: SlotColor[] }) {
  return (
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
  );
}
