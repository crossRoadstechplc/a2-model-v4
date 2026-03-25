import { render, screen } from '@testing-library/react';
import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../../engine/a2Fleet';
import { StatementTable } from '../StatementTable';

describe('StatementTable', () => {
  it('renders dense finance-friendly tables and highlights changed cells', () => {
    const workbook = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const previousWorkbook = runA2FleetWorkbook({
      ...getBaseAssumptionBundle().baseValues,
      'a2_fleet.number_of_trucks.cy_2027': 700,
    });

    render(
      <StatementTable
        title="Income Statement"
        description="Test table."
        statement={workbook.incomeStatement}
        previousStatement={previousWorkbook.incomeStatement}
        dataTestId="statement-table-income-statement"
      />,
    );

    const revenue2037Cell = screen.getByTestId(
      'statement-cell-statement-table-income-statement-revenue-CY-2037',
    );

    expect(revenue2037Cell).toHaveTextContent('$577,485,418');
    expect(revenue2037Cell).toHaveAttribute('data-state', 'changed');
    expect(
      screen.getByTestId('statement-table-income-statement').textContent,
    ).not.toContain('IRR');
    expect(
      screen.getByTestId('statement-table-income-statement').textContent,
    ).toMatchInlineSnapshot(
      `"Line itemCY-2026CY-2027CY-2028CY-2029CY-2030CY-2031CY-2032CY-2033CY-2034CY-2035CY-2036CY-2037Revenue$$0$34,893,871$73,277,129$115,411,478$169,270,168$232,746,481$307,225,355$394,430,311$433,873,342$477,260,676$524,986,744$577,485,418Battery Charge$$0$15,961,355$35,114,981$57,939,718$84,978,253$116,845,098$154,235,529$198,014,802$217,816,282$239,597,911$263,557,702$289,913,472Gross Margin$$0$18,932,516$38,162,148$57,471,760$84,291,915$115,901,383$152,989,826$196,415,509$216,057,060$237,662,766$261,429,042$287,571,947Operating Expenses$$0$5,000,000$6,000,000$7,200,000$8,640,000$10,368,000$12,441,600$14,929,920$17,915,904$21,499,085$25,798,902$30,958,682Variable OPEX$$0$8,723,468$18,319,282$28,852,870$42,317,542$58,186,620$76,806,339$98,607,578$108,468,336$119,315,169$131,246,686$144,371,355EBITDA$$0$5,209,048$13,842,866$21,418,891$33,334,373$47,346,763$63,741,887$82,878,011$89,672,820$96,848,512$104,383,455$112,241,910Depreciation$$0$3,507,000$6,839,000$10,171,000$13,503,000$16,835,000$20,167,000$23,508,333$23,508,333$23,383,333$23,383,333$23,333,333EBT$$0$1,702,048$7,003,866$11,247,891$19,831,373$30,511,763$43,574,887$59,369,678$66,164,487$73,465,179$81,000,121$88,908,577Tax$$0$510,615$2,101,160$3,374,367$5,949,412$9,153,529$13,072,466$17,810,903$19,849,346$22,039,554$24,300,036$29,160,044Net Income$$0$1,191,434$4,902,706$7,873,523$13,881,961$21,358,234$30,502,421$41,558,775$46,315,141$51,425,625$56,700,085$59,748,533Investor Net Income 25%$-$61,480,000$297,858$1,225,677$1,968,381$3,470,490$5,339,558$7,625,605$10,389,694$11,578,785$12,856,406$14,175,021$14,937,133"`
    );
  });
});
