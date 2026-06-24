import Image from "next/image";
import { greatHollowMaps, GREAT_HOLLOW_CREDIT } from "@/data/greatHollow";
import { asset } from "@/lib/assets";

/**
 * The two labeled "Colorblinded" Great Hollow maps, shown as a static
 * reference. Each crystal is marked with the set(s) it belongs to (A/B/C/D).
 */
export function GreatHollowMaps() {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {greatHollowMaps.map((m) => (
          <figure key={m.id}>
            <figcaption className="eyebrow mb-2">{m.label}</figcaption>
            <div className="relative overflow-hidden rounded-lg border border-night-600 bg-night-900">
              <Image
                src={asset(m.image)}
                alt={`Great Hollow ${m.label} — crystal sets`}
                width={m.width}
                height={m.height}
                className="block h-auto w-full select-none"
                priority={m.id === "surface"}
              />
            </div>
          </figure>
        ))}
      </div>

      <p className="mt-5 font-body text-xs text-parchment-faint">{GREAT_HOLLOW_CREDIT}</p>
    </div>
  );
}
