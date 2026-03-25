import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { NumericInput } from '../NumericInput';

function NumericInputHarness() {
  const [value, setValue] = useState(1234.5);

  return (
    <NumericInput
      label="Test numeric field"
      value={value}
      decimals={1}
      unit="%"
      onCommit={setValue}
    />
  );
}

describe('NumericInput', () => {
  it('uses typed entry, shows raw values on focus, and formats on blur', async () => {
    const user = userEvent.setup();
    render(<NumericInputHarness />);

    const input = screen.getByRole('textbox', { name: 'Test numeric field' });

    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveValue('1,234.5');

    await user.click(input);
    expect(input).toHaveValue('1234.5');

    await user.clear(input);
    await user.type(input, '1300.2');
    expect(input).toHaveValue('1300.2');

    fireEvent.wheel(input);
    expect(input).toHaveValue('1,300.2');
  });
});
