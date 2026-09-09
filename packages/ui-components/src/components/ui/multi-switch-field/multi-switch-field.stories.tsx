import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { createFieldStates } from '#src/stories/field-states.js';

import { MultiSwitchField } from './multi-switch-field.js';

const options = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
];

const getOptionLabel = (option: unknown): string =>
  (option as { label: string }).label;
const getOptionValue = (option: unknown): string =>
  (option as { value: string }).value;

const meta: Meta<typeof MultiSwitchField> = {
  title: 'components/MultiSwitchField',
  component: MultiSwitchField,
  tags: ['autodocs'],
  args: {
    options,
    getOptionLabel,
    getOptionValue,
  },
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

const states = createFieldStates({
  label: 'Notifications',
  description: 'Choose how you want to be notified.',
  error: 'At least one notification method is required.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = {
  args: { ...states.Disabled, value: ['email'] },
};

export const Preselected: Story = {
  args: { ...states.WithLabel, value: ['email', 'push'] },
};
