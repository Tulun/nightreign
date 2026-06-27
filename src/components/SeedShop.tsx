"use client";

import { useState } from "react";
import type { MerchantSet } from "@/lib/types";
import { MerchantSection } from "./MerchantSection";
import { LegendarySection } from "./LegendarySection";

/**
 * A set's Super + Normal merchant stock, with a "Deep of Night" toggle that
 * reveals item curses (the drawbacks that apply on Deep of Night merchants).
 */
export function SeedShop({ set }: { set: MerchantSet }) {
  const [deepOfNight, setDeepOfNight] = useState(false);

  return (
    <div>
      <label className="mb-5 flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-night-600 bg-night-800/60 px-3 py-2">
        <input
          type="checkbox"
          checked={deepOfNight}
          onChange={(e) => setDeepOfNight(e.target.checked)}
          className="h-4 w-4 accent-red-400"
        />
        <span className="font-body text-sm text-parchment">Deep of Night</span>
        <span className="font-body text-xs text-parchment-faint">— cursed / swapped items</span>
      </label>

      <div className="space-y-8">
        <MerchantSection title="Super Merchant" merchant={set.special} deepOfNight={deepOfNight} />
        <MerchantSection title="Normal Merchant" merchant={set.normal} deepOfNight={deepOfNight} />
        <LegendarySection items={set.legendary} />
      </div>
    </div>
  );
}
