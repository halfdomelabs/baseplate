import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { AsyncComboboxField } from './async-combobox-field.js';

interface MockUser {
  id: string;
  name: string;
  email: string;
}

// Mock data for stories
const MOCK_USERS: MockUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
  { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' },
  { id: '6', name: 'Diana Davis', email: 'diana@example.com' },
  { id: '7', name: 'Eve Miller', email: 'eve@example.com' },
  { id: '8', name: 'Frank Garcia', email: 'frank@example.com' },
];

// Mock async function that simulates API call
const createMockLoadOptions =
  (delay = 1000, shouldError = false) =>
  async (searchQuery: string): Promise<MockUser[]> => {
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (shouldError) {
      throw new Error('Failed to load users from server');
    }

    if (!searchQuery) {
      return MOCK_USERS.slice(0, 3); // Return first 3 users for empty search
    }

    return MOCK_USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

const meta: Meta<typeof AsyncComboboxField> = {
  title: 'components/AsyncComboboxField',
  component: AsyncComboboxField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    loadingText: { control: { type: 'text' } },
    noResultsText: { control: { type: 'text' } },
    errorText: { control: { type: 'text' } },
    formatError: { control: false },
    resolveValue: { control: false },
    debounceMs: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
    loadingDelay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    minSearchLength: { control: { type: 'number', min: 0, max: 5, step: 1 } },
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState(ctx.args.value);

      const onChange = (newValue: string | null): void => {
        ctx.args.onChange?.(newValue);
        setValue(newValue);
      };

      return (
        <Story
          args={{
            ...ctx.args,
            value: value ?? ctx.args.value ?? null,
            onChange,
          }}
        />
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loadOptions: createMockLoadOptions(800),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
  },
};

export const Labelled: Story = {
  args: {
    loadOptions: createMockLoadOptions(800),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Select a user',
    description: 'Start typing to search for users',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
  },
};

export const WithCustomLabels: Story = {
  args: {
    loadOptions: createMockLoadOptions(800),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    renderItemLabel: (user, { selected }) => (
      <div className="flex flex-col">
        <span className={`font-medium ${selected ? 'text-primary' : ''}`}>
          {(user as MockUser).name}
        </span>
        <span className="text-sm text-muted-foreground">
          {(user as MockUser).email}
        </span>
      </div>
    ),
    label: 'Select a user',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
  },
};

export const FastLoading: Story = {
  args: {
    loadOptions: createMockLoadOptions(200),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Fast loading',
    description: 'This example has a 200ms delay',
    placeholder: 'Search users...',
    loadingText: 'Loading quickly...',
    className: 'w-96',
    debounceMs: 100,
  },
};

export const SlowLoading: Story = {
  args: {
    loadOptions: createMockLoadOptions(2000),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Slow loading',
    description: 'This example has a 2 second delay',
    placeholder: 'Search users...',
    loadingText: 'Please wait, loading...',
    className: 'w-96',
    debounceMs: 500,
  },
};

export const WithError: Story = {
  args: {
    loadOptions: createMockLoadOptions(800, true),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Error example',
    description: 'This will always fail to load options',
    placeholder: 'Search users...',
    errorText: 'Unable to load users. Please try again.',
    className: 'w-96',
    debounceMs: 300,
  },
};

export const MinSearchLength: Story = {
  args: {
    loadOptions: createMockLoadOptions(600),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Minimum search length',
    description: 'You must type at least 2 characters to search',
    placeholder: 'Type at least 2 characters...',
    className: 'w-96',
    debounceMs: 300,
    minSearchLength: 2,
  },
};

export const WithInitialOptions: Story = {
  args: {
    loadOptions: createMockLoadOptions(800),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'With initial options',
    description: 'Shows some options before searching',
    placeholder: 'Search or select from initial options...',
    className: 'w-96',
    debounceMs: 300,
    initialOptions: MOCK_USERS.slice(0, 3),
  },
};

export const CustomMessages: Story = {
  args: {
    loadOptions: createMockLoadOptions(800),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Custom messages',
    placeholder: 'Search users...',
    loadingText: 'Searching database...',
    noResultsText: 'No users match your search',
    errorText: 'Connection failed. Check your internet.',
    className: 'w-96',
    debounceMs: 300,
  },
};

export const WithCustomErrorFormatter: Story = {
  args: {
    loadOptions: createMockLoadOptions(800, true),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Custom error formatting',
    description: 'This example uses a custom formatError function',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
    formatError: (error: unknown) => {
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          return '🌐 Network error - please check your connection';
        }
        if (error.message.includes('timeout')) {
          return '⏱️ Request timed out - please try again';
        }
        return `❌ Error: ${error.message}`;
      }
      return '🚨 Something went wrong - please try again later';
    },
  },
};

export const NoLoadingDelay: Story = {
  args: {
    loadOptions: createMockLoadOptions(300),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'No loading delay',
    description: 'Shows loading immediately (loadingDelay = 0)',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 100,
    loadingDelay: 0,
  },
};

export const LongLoadingDelay: Story = {
  args: {
    loadOptions: createMockLoadOptions(400),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Long loading delay',
    description: 'Waits 500ms before showing loading (loadingDelay = 500)',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 100,
    loadingDelay: 500,
  },
};

export const FastRequestNoFlashing: Story = {
  args: {
    loadOptions: createMockLoadOptions(100),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Fast requests without flashing',
    description:
      'Fast 100ms requests with 200ms loading delay - no loading indicator should show',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 50,
    loadingDelay: 200,
  },
};

export const PersistentSelectedValue: Story = {
  args: {
    loadOptions: createMockLoadOptions(600),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    label: 'Persistent selected value',
    description:
      'Select a user, then search for something else - the selected value persists',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
    value: '2', // Pre-select Jane Smith
  },
};

export const WithValueResolver: Story = {
  args: {
    loadOptions: createMockLoadOptions(600),
    getOptionLabel: (user) => (user as MockUser).name,
    getOptionValue: (user) => (user as MockUser).id,
    resolveValue: async (value: string | null) => {
      if (!value) return null;
      // Simulate API call to resolve user by ID
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_USERS.find((user) => user.id === value) ?? null;
    },
    label: 'With value resolver',
    description:
      'Uses resolveValue to fetch option details when value is set externally',
    placeholder: 'Search users...',
    className: 'w-96',
    debounceMs: 300,
    value: '5', // Pre-select Charlie Wilson (not in initial options)
  },
};
