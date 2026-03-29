import { screen } from '@testing-library/react';
import { ValidationReportDashboard } from '../ValidationReportDashboard';
import { renderWithRouter } from '../../../test/renderApp';

describe('ValidationReportDashboard', () => {
  it('renders the workbook validation summary without raw artifact downloads', () => {
    renderWithRouter(<ValidationReportDashboard />);

    expect(
      screen.getByRole('heading', { name: 'Validation Report', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('validation-fit-summary')).toHaveTextContent(
      'Fit to proceed',
    );
    expect(screen.getByTestId('validation-assumptions-matched-count')).toHaveTextContent(
      '88',
    );
    expect(screen.getByTestId('validation-outputs-passed-count')).toHaveTextContent(
      '8',
    );
    expect(screen.getByText('Base Assumptions Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Baseline Output Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Known Workbook Quirks')).toBeInTheDocument();
    expect(
      screen.getByText(/A2 E FLEET OPERATIONS\s+FINANCIALS-VER 2\.xlsx/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Export Artifacts')).not.toBeInTheDocument();
  });
});
