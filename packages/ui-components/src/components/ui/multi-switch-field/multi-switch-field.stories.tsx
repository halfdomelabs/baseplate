import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { MultiSwitchField } from './multi-switch-field.js';

const options = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
];

const meta: Meta<typeof MultiSwitchField> = {
  title: 'components/MultiSwitchField',
  component: MultiSwitchField,
  tags: ['autodocs'],
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string[]>(ctx.args.value ?? []);
      return (
        <Story
          args={{
            ...ctx.args,
            value,
            onChange: (newValue: string[]) => {
              ctx.args.onChange?.(newValue);
              setValue(newValue);
            },
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
    label: 'Notifications',
    options,
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Notifications',
    description: 'Choose how you want to be notified',
    options,
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
  },
};

export const WithError: Story = {
  args: {
    label: 'Notifications',
    error: 'At least one notification method is required',
    options,
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
  },
};

export const Preselected: Story = {
  args: {
    label: 'Notifications',
    value: ['email', 'push'],
    options,
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Notifications',
    disabled: true,
    value: ['email'],
    options,
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
  },
};
