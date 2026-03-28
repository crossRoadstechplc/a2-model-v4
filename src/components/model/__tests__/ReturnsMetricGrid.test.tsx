import { render, screen } from '@testing-library/react';
import { ReturnsMetricGrid } from '../ReturnsMetricGrid';
import type { EntityReturnsSummary } from '../../../engine/returns';

describe('ReturnsMetricGrid', () => {
  it('renders ready and pending return metrics gracefully', () => {
    const summary: EntityReturnsSummary = {
      title: 'Returns / Valuation',
      basisLabel: 'Test cash flow basis.',
      cashFlowSeries: [-100, 30, 40, 120],
      returnsMetrics: {
        projectIrr: {
          id: 'project_irr',
          label: 'Project IRR',
          value: null,
          format: 'percent',
          description: 'Pending.',
          status: 'pending',
          notes: ['Pending until a project cash flow stream is modeled.'],
        },
        equityIrr: {
          id: 'equity_irr',
          label: 'Equity IRR',
          value: 18.4,
          format: 'percent',
          description: 'Cumulative equity return.',
          status: 'ready',
          notes: ['Workbook-faithful test metric.'],
        },
        npv: {
          id: 'npv',
          label: 'NPV',
          value: null,
          format: 'currencyM',
          description: 'Pending.',
          status: 'pending',
        },
        paybackPeriod: {
          id: 'payback_period',
          label: 'Payback Period',
          value: null,
          format: 'number',
          description: 'Pending.',
          status: 'pending',
        },
        moic: {
          id: 'moic',
          label: 'MOIC',
          value: null,
          format: 'multiple',
          description: 'Pending.',
          status: 'pending',
        },
      },
      metrics: [
        {
          id: 'equity_irr',
          label: 'Equity IRR',
          value: 18.4,
          format: 'percent',
          description: 'Cumulative equity return.',
          status: 'ready',
          notes: ['Workbook-faithful test metric.'],
        },
        {
          id: 'project_irr',
          label: 'Project IRR',
          value: null,
          format: 'percent',
          description: 'Pending.',
          status: 'pending',
          notes: ['Pending until a project cash flow stream is modeled.'],
        },
      ],
      additionalMetrics: [],
      seriesDefinitions: [
        {
          type: 'equity',
          label: 'Test equity series',
          values: [-100, 30, 40, 120],
          note: 'Test only.',
        },
      ],
      terminalValuePolicy: {
        method: 'equityStake',
        value: 120,
        note: 'Test terminal stake value.',
      },
      notes: ['Top-level returns note.'],
    };

    render(<ReturnsMetricGrid summary={summary} dataTestId="returns-grid" />);

    expect(screen.getByTestId('returns-card-equity_irr-value')).toHaveTextContent('18.4%');
    expect(screen.getByTestId('returns-card-project_irr-value')).toHaveTextContent('Pending');
    expect(screen.getByText('Test cash flow basis.')).toBeInTheDocument();
    expect(screen.getByText('equityStake')).toBeInTheDocument();
    expect(screen.getByText('Test terminal stake value.')).toBeInTheDocument();
    expect(screen.getByText('Top-level returns note.')).toBeInTheDocument();
    expect(screen.getByTestId('returns-card-equity_irr-note')).toHaveTextContent(
      'Workbook-faithful test metric.',
    );
  });
});
