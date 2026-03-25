import { cn } from '../../lib/cn';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import type { PeriodizedStatement } from '../../engine/a2Fleet';
import { getDisplayUnit } from '../../model/displayCurrency';
import { formatStatementValue, hasMeaningfulChange } from './formatters';

type StatementTableProps = {
  title: string;
  description: string;
  statement: PeriodizedStatement;
  previousStatement?: PeriodizedStatement | null;
  rowKeys?: string[];
  dataTestId: string;
};

function buildRowLookup(statement?: PeriodizedStatement | null) {
  return Object.fromEntries(
    (statement?.rows ?? []).map((row) => [row.key, row.values]),
  ) as Record<string, number[]>;
}

export function StatementTable({
  title,
  description,
  statement,
  previousStatement,
  rowKeys,
  dataTestId,
}: StatementTableProps) {
  const previousLookup = buildRowLookup(previousStatement);
  const { displayCurrency, fxRate } = useDisplayCurrency();
  const visibleRows = rowKeys
    ? statement.rows.filter((row) => rowKeys.includes(row.key))
    : statement.rows;

  return (
    <article className="rounded-2xl border border-app-border bg-app-panel/80 shadow-sm">
      <div className="border-b border-app-border px-4 py-4">
        <h3 className="text-sm font-semibold text-app-text">{title}</h3>
        <p className="mt-1 text-sm text-app-subtle">{description}</p>
      </div>

      <div className="overflow-x-auto" data-testid={dataTestId}>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-app-border bg-app-bg/60">
              <th className="sticky left-0 z-10 min-w-[16rem] bg-app-bg/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                Line item
              </th>
              {statement.periods.map((period) => (
                <th
                  key={period}
                  className="min-w-[7.5rem] px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle"
                >
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.key} className="border-b border-app-border/70 last:border-b-0">
                <th className="sticky left-0 z-10 bg-app-panel px-4 py-3 text-left align-top">
                  <div>
                    <p className="font-medium text-app-text">{row.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-app-subtle">
                      {getDisplayUnit(row.unit, displayCurrency)}
                    </p>
                  </div>
                </th>
                {row.values.map((value, index) => {
                  const previousValue = previousLookup[row.key]?.[index];
                  const isChanged = hasMeaningfulChange(value, previousValue);

                  return (
                    <td
                      key={`${row.key}-${statement.periods[index]}`}
                      className={cn(
                        'px-3 py-3 text-right font-mono text-xs text-app-text',
                        isChanged && 'bg-app-accentSoft/35',
                        value < 0 && 'text-app-warning',
                      )}
                      data-state={isChanged ? 'changed' : 'steady'}
                      data-testid={`statement-cell-${dataTestId}-${row.key}-${statement.periods[index]}`}
                    >
                      {formatStatementValue(value, row.unit, {
                        displayCurrency,
                        fxRate,
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
