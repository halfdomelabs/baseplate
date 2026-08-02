import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { RadioField } from './radio-field.js';

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
];

function renderRadioField(
  props: Partial<React.ComponentProps<typeof RadioField>> = {},
): void {
  renderWithProviders(
    <RadioField
      label="Pick"
      options={options}
      getOptionLabel={(option) => (option as { label: string }).label}
      getOptionValue={(option) => (option as { value: string }).value}
      {...props}
    />,
  );
}

describe('RadioField', () => {
  it('leaves every option unchecked when the value is empty', () => {
    renderRadioField({ value: null });

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('checks only the option matching the value', () => {
    renderRadioField({ value: '2' });

    const [first, second] = screen.getAllByRole('radio');
    expect(first).toHaveAttribute('aria-checked', 'false');
    expect(second).toHaveAttribute('aria-checked', 'true');
  });
});
