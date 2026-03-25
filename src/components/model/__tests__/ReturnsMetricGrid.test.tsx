import { render, screen } from '@testing-library/react';
import { ReturnsMetricGrid } from '../ReturnsMetricGrid';
import type { EntityReturnsSummary } from '../../../engine/returns';

describe('ReturnsMetricGrid', () => {
  it('renders ready and pending return metrics gracefully', () => {
    const summary: EntityReturnsSummary = {
      title: 'Returns / Valuation',
      basisLabel: 'Test cash flow basis.',
      cashFlowSeries: [-100, 30, 40, 120],
      metrics: [
        {
          id: 'equity_irr',
          label: 'Equity IRR',
          value: 18.4,
          format: 'percent',
          description: 'Cumulative equity return.',
          status: 'ready',
        },
        {
          id: 'project_irr',
          label: 'Project IRR',
          value: null,
          format: 'percent',
          description: 'Pending.',
          status: 'pending',
        },
      ],
    };

    render(<ReturnsMetricGrid summary={summary} dataTestId="returns-grid" />);

    expect(screen.getByTestId('returns-card-equity_irr-value')).toHaveTextContent('18.4%');
    expect(screen.getByTestId('returns-card-project_irr-value')).toHaveTextContent('Pending');
    expect(screen.getByText('Test cash flow basis.')).toBeInTheDocument();
  });
});
