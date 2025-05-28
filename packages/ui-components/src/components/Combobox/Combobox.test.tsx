import type React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import type { ComboboxProps } from './Combobox.js';

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
} from './Combobox.js';

const mockOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
];

const TestCombobox = ({
  value,
  onChange = vi.fn(),
  disabled = false,
  placeholder = 'Select fruit...',
  options = mockOptions,
}: {
  value: ComboboxProps['value'];
  onChange?: ComboboxProps['onChange'];
  disabled?: ComboboxProps['disabled'];
  placeholder?: string;
  options?: { value: string; label: string }[];
}): React.JSX.Element => (
  <Combobox value={value} onChange={onChange} disabled={disabled}>
    <ComboboxInput placeholder={placeholder} />
    <ComboboxContent>
      {options.map((option) => (
        <ComboboxItem
          key={option.value}
          value={option.value}
          label={option.label}
        >
          {option.label}
        </ComboboxItem>
      ))}
    </ComboboxContent>
  </Combobox>
);

describe('Combobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with placeholder when no value is selected', () => {
      renderWithProviders(<TestCombobox value={null} />);
      expect(
        screen.getByPlaceholderText('Select fruit...'),
      ).toBeInTheDocument();
    });

    it('renders with selected value', () => {
      renderWithProviders(<TestCombobox value={mockOptions[0]} />);
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('renders in disabled state', () => {
      renderWithProviders(<TestCombobox disabled value={null} />);
      const input = screen.getByRole('combobox');
      expect(input).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown on click', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');
      await userEvent.click(input);

      await waitFor(() => {
        for (const option of mockOptions) {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        }
      });
    });

    it('filters options based on input', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');

      await userEvent.click(input);
      await userEvent.type(input, 'ap');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
      });
    });

    it('selects option on click', async () => {
      const onChange = vi.fn();
      renderWithProviders(<TestCombobox value={null} onChange={onChange} />);

      const input = screen.getByRole('combobox');
      await userEvent.click(input);

      const option = await screen.findByText('Apple');
      await userEvent.click(option);

      expect(onChange).toHaveBeenCalledWith({
        value: 'apple',
        label: 'Apple',
      });
    });

    it('clears search query after selection', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');

      await userEvent.click(input);
      await userEvent.type(input, 'ap');
      const option = await screen.findByText('Apple');
      await userEvent.click(option);

      expect(input).toHaveValue('');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on arrow down', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');

      input.focus();
      await userEvent.keyboard('{ArrowDown}');

      await waitFor(() => {
        for (const option of mockOptions) {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        }
      });
    });

    it('closes dropdown on escape', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');

      // Open dropdown
      await userEvent.click(input);
      // Verify it's open
      expect(await screen.findByText('Apple')).toBeInTheDocument();

      // Press escape
      await userEvent.keyboard('{Escape}');

      // Verify it's closed
      await waitFor(() => {
        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      });
    });

    it('selects option with enter key', async () => {
      const onChange = vi.fn();
      renderWithProviders(<TestCombobox value={null} onChange={onChange} />);

      const input = screen.getByRole('combobox');
      input.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(await screen.findByText('Apple')).toBeInTheDocument();
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalled();
    });

    it('selects a specific option with enter key', async () => {
      const onChange = vi.fn();
      renderWithProviders(
        <TestCombobox
          options={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'orange', label: 'Orange' },
          ]}
          value={null}
          onChange={onChange}
        />,
      );

      const input = screen.getByRole('combobox');
      input.focus();
      await userEvent.keyboard('ban');
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith({
        value: 'banana',
        label: 'Banana',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search results', async () => {
      renderWithProviders(<TestCombobox value={null} />);
      const input = screen.getByRole('combobox');

      await userEvent.click(input);
      await userEvent.keyboard('xyz');

      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    it('maintains selected value when closing without selection', async () => {
      const initialValue = mockOptions[0];
      const onChange = vi.fn();

      renderWithProviders(
        <TestCombobox value={initialValue} onChange={onChange} />,
      );
      const input = screen.getByRole('combobox');

      await userEvent.click(input);
      await userEvent.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(initialValue.label)).toBeInTheDocument();
    });
  });
});
