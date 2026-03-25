import { createWorkbookCellGetter, evaluateFormula } from '../formula';
import type { WorkbookFormulaMap } from '../reference';

describe('a2 fleet formula evaluator', () => {
  it('evaluates workbook arithmetic, ranges, and cross-sheet references', () => {
    const formulaMap: WorkbookFormulaMap = {
      ASSUMPTIONS_DATA: {
        C1: {
          formula: '=SUM(D1:F1)',
          value: 6,
          precedents: [],
        },
        G1: {
          formula: '=C1/2',
          value: 3,
          precedents: [],
        },
      },
      'REVENUE PROJECTION': {
        C5: {
          formula: "='ASSUMPTIONS_DATA'!G1+'ASSUMPTIONS_DATA'!D1",
          value: 4,
          precedents: [],
        },
      },
    };

    const workbook = createWorkbookCellGetter(formulaMap, {
      ASSUMPTIONS_DATA: {
        D1: 1,
        E1: 2,
        F1: 3,
      },
    });

    expect(workbook.getCellValue('ASSUMPTIONS_DATA', 'C1')).toBe(6);
    expect(workbook.getCellValue('ASSUMPTIONS_DATA', 'G1')).toBe(3);
    expect(workbook.getCellValue('REVENUE PROJECTION', 'C5')).toBe(4);
  });

  it('supports IRR formulas', () => {
    const result = evaluateFormula(
      '=IRR(C19:O19,0.1)',
      'INCOME STATEMENT ',
      (_sheet, cell) => {
        const series = [
          -10,
          3,
          4,
          4,
          3,
          2,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
        ];
        const columnIndex = cell.charCodeAt(0) - 67;
        return series[columnIndex] ?? 0;
      },
    );

    expect(result).toBeGreaterThan(0.05);
    expect(result).toBeLessThan(0.25);
  });
});
