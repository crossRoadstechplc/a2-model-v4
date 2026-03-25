import { render, screen, within } from '@testing-library/react';
import { TrendChartCard } from '../TrendChartCard';

describe('TrendChartCard', () => {
  it('renders chart sections and marks changed series', () => {
    render(
      <TrendChartCard
        title="Revenue and EBITDA"
        description="Trend overview."
        periods={['CY-2026', 'CY-2027', 'CY-2028']}
        series={[
          {
            id: 'revenue',
            label: 'Revenue',
            values: [0, 34.9, 73.3],
            colorClassName: 'text-app-accent',
            format: 'currencyM',
          },
          {
            id: 'ebitda',
            label: 'EBITDA',
            values: [0, 5.2, 13.8],
            colorClassName: 'text-app-success',
            format: 'currencyM',
          },
        ]}
        previousSeries={[
          {
            id: 'revenue',
            label: 'Revenue',
            values: [0, 30, 70],
            colorClassName: 'text-app-accent',
            format: 'currencyM',
          },
          {
            id: 'ebitda',
            label: 'EBITDA',
            values: [0, 5.2, 13.8],
            colorClassName: 'text-app-success',
            format: 'currencyM',
          },
        ]}
        dataTestId="trend-card"
      />,
    );

    expect(screen.getByTestId('trend-card')).toHaveAttribute('data-state', 'changed');
    expect(screen.getByRole('img', { name: 'Revenue and EBITDA' })).toBeInTheDocument();
    expect(screen.getByTestId('trend-card-legend')).toBeInTheDocument();
    expect(screen.getByTestId('trend-card-chart')).toBeInTheDocument();
    const legend = screen.getByTestId('trend-card-legend');
    expect(within(legend).getByText('Revenue')).toBeInTheDocument();
    expect(within(legend).getByText('EBITDA')).toBeInTheDocument();
    expect(screen.getByText('USD Millions')).toBeInTheDocument();
    expect(screen.getAllByText('CY-2028').length).toBeGreaterThan(0);
  });
});
