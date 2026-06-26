import { depthBuffs, DEPTH_COLUMNS } from "@/data/depthBuffs";

/** Enemy HP & Damage scaling per depth, with the Red-variant (R) bonus. */
export function DepthBuffs() {
  return (
    <div className="frame overflow-x-auto rounded-lg">
      <table className="w-full border-collapse text-left font-body text-sm">
        <thead>
          <tr className="text-parchment-faint">
            <th rowSpan={2} className="sticky left-0 z-10 border-b border-night-600 bg-night-850 px-3 py-2.5 align-bottom font-semibold">
              Enemy Type
            </th>
            <th colSpan={DEPTH_COLUMNS.length} className="border-b border-l border-night-600 bg-night-850 px-2.5 py-2 text-center font-semibold text-parchment">
              HP
            </th>
            <th colSpan={DEPTH_COLUMNS.length} className="border-b border-l border-night-600 bg-night-850 px-2.5 py-2 text-center font-semibold text-parchment">
              Damage
            </th>
          </tr>
          <tr className="text-parchment-faint">
            {DEPTH_COLUMNS.map((c, i) => (
              <th key={`hp-${c}`} className={`border-b border-night-600 bg-night-850 px-2.5 py-2 text-right font-semibold ${i === 0 ? "border-l text-red-300" : ""}`}>
                {c}
              </th>
            ))}
            {DEPTH_COLUMNS.map((c, i) => (
              <th key={`dmg-${c}`} className={`border-b border-night-600 bg-night-850 px-2.5 py-2 text-right font-semibold ${i === 0 ? "border-l text-red-300" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {depthBuffs.map((row) => (
            <tr key={row.enemy} className="border-b border-night-800/70 hover:bg-night-800/60">
              <td className="sticky left-0 z-10 bg-night-900 px-3 py-2.5 font-display font-semibold text-parchment">
                {row.enemy}
                {row.note && (
                  <span className="ml-1.5 font-body text-xs font-normal italic text-parchment-faint">({row.note})</span>
                )}
              </td>
              {row.hp.map((v, i) => (
                <Cell key={`hp-${i}`} value={v} red={i === 0} />
              ))}
              {row.dmg.map((v, i) => (
                <Cell key={`dmg-${i}`} value={v} red={i === 0} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, red }: { value: string; red: boolean }) {
  const na = value === "N/A";
  return (
    <td
      className={`whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums ${red ? "border-l border-night-800/70" : ""} ${
        na ? "text-parchment-faint" : red ? "text-red-300" : "text-parchment-muted"
      }`}
    >
      {value}
    </td>
  );
}
