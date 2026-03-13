import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { AsyncComboboxField } from './async-combobox-field.js';

interface MockOption {
  label: string;
  value: string;
}

const MOCK_OPTIONS: MockOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

function createLoadOptions(options: MockOption[] = MOCK_OPTIONS): {
  loadOptions: (query: string) => Promise<MockOption[]>;
  mock: ReturnType<typeof vi.fn>;
} {
  const mock = vi.fn((query: string) => {
    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase()),
    );
    return Promise.resolve(filtered);
  });
  return { loadOptions: mock, mock };
}

function createFailingLoadOptions(errorMessage = 'Load failed'): {
  loadOptions: (query: string) => Promise<MockOption[]>;
  mock: ReturnType<typeof vi.fn>;
} {
  const mock = vi.fn(
    (): Promise<MockOption[]> => Promise.reject(new Error(errorMessage)),
  );
  return { loadOptions: mock, mock };
}

function typeInInput(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } });
}

describe('AsyncComboboxField', () => {
  it('should render with label and placeholder', () => {
    const { loadOptions } = createLoadOptions();

    renderWithProviders(
      <AsyncComboboxField
        label="Select fruit"
        placeholder="Search fruits..."
        loadOptions={loadOptions}
        value={null}
      />,
    );

    expect(screen.getByText('Select fruit')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument();
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce search calls', async () => {
      const { loadOptions, mock } = createLoadOptions();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          debounceMs={300}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');

      // Simulate rapid typing
      typeInInput(input, 'a');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      typeInInput(input, 'ap');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      typeInInput(input, 'app');

      // Not yet past debounce
      expect(mock).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith('app');
    });

    it('should respect minSearchLength', async () => {
      const { loadOptions, mock } = createLoadOptions();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          debounceMs={100}
          minSearchLength={3}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');

      // Type fewer chars than minSearchLength
      typeInInput(input, 'ab');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(mock).not.toHaveBeenCalled();

      // Now type enough chars
      typeInInput(input, 'abc');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with null when input is cleared', () => {
      const onChange = vi.fn();
      const { loadOptions } = createLoadOptions();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          onChange={onChange}
          debounceMs={100}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');

      // Type something then clear it
      typeInInput(input, 'Apple');
      typeInInput(input, '');

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('with real timers', () => {
    it('should show options after successful load', async () => {
      const { loadOptions } = createLoadOptions();
      const user = userEvent.setup();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          debounceMs={0}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'a');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });
    });

    it('should call onChange when an option is selected', async () => {
      const { loadOptions } = createLoadOptions();
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          onChange={onChange}
          debounceMs={0}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'Apple');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Apple'));

      expect(onChange).toHaveBeenCalledWith('apple');
    });

    it('should show error state when loadOptions fails', async () => {
      const { loadOptions } = createFailingLoadOptions('Load failed');
      const user = userEvent.setup();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          debounceMs={0}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('Load failed')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching', async () => {
      let resolveLoad: (() => void) | undefined;
      const loadOptions = vi.fn(
        () =>
          new Promise<MockOption[]>((resolve) => {
            resolveLoad = () => {
              resolve(MOCK_OPTIONS);
            };
          }),
      );
      const user = userEvent.setup();

      renderWithProviders(
        <AsyncComboboxField
          label="Fruit"
          loadOptions={loadOptions}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
          debounceMs={0}
          value={null}
        />,
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'app');

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Cleanup: resolve the pending promise
      act(() => {
        resolveLoad?.();
      });
    });
  });
});
