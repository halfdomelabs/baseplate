import type { Control } from 'react-hook-form';

import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { NumberField, NumberFieldController } from './number-field.js';

interface TestFormValues {
  quantity?: number | null;
}

function ControlledNumberField(): React.ReactElement {
  const [value, setValue] = useState<number | null>(null);
  return <NumberField label="Qty" value={value} onChange={setValue} />;
}

function TestForm({
  onControl,
}: {
  onControl: (control: Control<TestFormValues>) => void;
}): React.ReactElement {
  const { control } = useForm<TestFormValues>();
  onControl(control);
  return (
    <NumberFieldController control={control} name="quantity" label="Qty" />
  );
}

describe('NumberField', () => {
  it('emits null when the input is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <NumberField label="Qty" value={5} onChange={onChange} />,
    );

    await user.clear(screen.getByLabelText('Qty'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
    });
    expect(onChange).not.toHaveBeenCalledWith(Number.NaN);
  });

  it('emits a number when the user types a value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<NumberField label="Qty" onChange={onChange} />);

    await user.type(screen.getByLabelText('Qty'), '42');

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(42);
    });
  });

  it('emits numbers via the increment and decrement buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <NumberField label="Qty" value={5} onChange={onChange} />,
    );

    await user.click(screen.getByLabelText('Increase'));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(6);
    });

    await user.click(screen.getByLabelText('Decrease'));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(4);
    });
  });

  it('reflects an externally changed value', async () => {
    const { rerender } = renderWithProviders(
      <NumberField label="Qty" value={1} />,
    );
    expect(screen.getByLabelText('Qty')).toHaveValue('1');

    rerender(<NumberField label="Qty" value={9} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Qty')).toHaveValue('9');
    });
  });

  it('preserves in-progress text that is not yet a valid number', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledNumberField />);
    const input = screen.getByLabelText('Qty');

    await user.type(input, '-1.');
    expect(input).toHaveValue('-1.');

    await user.type(input, '5');
    await waitFor(() => {
      expect(input).toHaveValue('-1.5');
    });
  });

  it('renders a controlled input for an uninitialized form field', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Intentionally silent — assertions below inspect the captured calls.
    });
    let control: Control<TestFormValues> | undefined;
    renderWithProviders(
      <TestForm
        onControl={(c) => {
          control = c;
        }}
      />,
    );

    await user.type(screen.getByLabelText('Qty'), '7');

    await waitFor(() => {
      expect(control?._formValues.quantity).toBe(7);
    });
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('uncontrolled'),
      expect.anything(),
      expect.anything(),
    );

    errorSpy.mockRestore();
  });
});
