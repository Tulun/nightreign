import { libraSwapTargets, libraNativeStats, LIBRA_STAT_NOTE } from "@/data/libra";
import { LIBRA_STAT_COLUMNS, type LibraStatRow } from "@/lib/libra";

/**
 * The stat-swap deal reference: the fixed "more ___" statlines you can be set
 * to, and each Nightfarer's native level-15 attributes for comparison.
 */
export function LibraStatTable() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-night-600">
              <th className="px-2 py-2 text-left font-body text-xs uppercase tracking-wide text-parchment-faint">
                Option
              </th>
              {LIBRA_STAT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-right font-body text-xs uppercase tracking-wide text-parchment-faint"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {libraSwapTargets.map((row) => (
              <Row key={row.label} row={row} highlight />
            ))}
            <tr>
              <td colSpan={LIBRA_STAT_COLUMNS.length + 1} className="pt-3" />
            </tr>
            {libraNativeStats.map((row) => (
              <Row key={row.label} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-body text-xs text-parchment-faint">{LIBRA_STAT_NOTE}</p>
    </div>
  );
}

function Row({ row, highlight }: { row: LibraStatRow; highlight?: boolean }) {
  return (
    <tr className="border-b border-night-800">
      <td
        className={`px-2 py-2 font-display ${
          highlight ? "font-semibold text-gold-bright" : "text-parchment"
        }`}
      >
        {row.label}
        {row.derived && <span className="ml-1 align-super text-[0.6rem] text-parchment-faint">†</span>}
      </td>
      {LIBRA_STAT_COLUMNS.map((col) => (
        <td key={col.key} className="px-2 py-2 text-right font-display tabular-nums text-parchment-muted">
          {row.stats[col.key]}
        </td>
      ))}
    </tr>
  );
}
