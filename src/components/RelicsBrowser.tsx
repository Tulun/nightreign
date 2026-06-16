"use client";

import { useState } from "react";
import { RelicEffects } from "@/components/RelicEffects";
import { DeepRelicEffects } from "@/components/DeepRelicEffects";

type Pool = "normal" | "deep";

const POOLS: { key: Pool; label: string }[] = [
  { key: "normal", label: "Normal Relics" },
  { key: "deep", label: "Deep Relics" },
];

export function RelicsBrowser() {
  const [pool, setPool] = useState<Pool>("normal");

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
        {POOLS.map((p) => {
          const active = p.key === pool;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPool(p.key)}
              aria-pressed={active}
              className={`frame rounded-lg px-2 py-3 font-display text-sm font-semibold transition-all ${
                active ? "bg-night-700 text-gold-bright shadow-lift" : "bg-night-800 text-parchment-muted hover:bg-night-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {pool === "normal" ? <RelicEffects /> : <DeepRelicEffects />}
    </div>
  );
}
