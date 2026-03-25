import { fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { ValidationReportDashboard } from '../ValidationReportDashboard';
import { renderWithRouter } from '../../../test/renderApp';

describe('ValidationReportDashboard', () => {
  it('renders the workbook validation summary and export actions', () => {
    renderWithRouter(<ValidationReportDashboard />);

    expect(
      screen.getByRole('heading', { name: 'Validation Report', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('validation-fit-summary')).toHaveTextContent(
      'Fit to proceed',
    );
    expect(screen.getByTestId('validation-assumptions-matched-count')).toHaveTextContent(
      '33',
    );
    expect(screen.getByTestId('validation-outputs-passed-count')).toHaveTextContent(
      '8',
    );
    expect(screen.getByText('Base Assumptions Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Baseline Output Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Known Workbook Quirks')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Export Artifacts/ }));
    expect(screen.getByTestId('validation-json-download')).toHaveAttribute(
      'download',
      'a2-fleet-validation-report.json',
    );
    expect(screen.getByTestId('validation-markdown-download')).toHaveAttribute(
      'download',
      'a2-fleet-validation-report.md',
    );
  });
});
