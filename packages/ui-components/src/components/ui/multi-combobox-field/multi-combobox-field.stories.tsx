import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { createFieldStates } from '#src/stories/field-states.js';

import { MultiComboboxField } from './multi-combobox-field.js';

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const getOptionLabel = (option: unknown): string =>
  (option as { label: string }).label;
const getOptionValue = (option: unknown): string =>
  (option as { value: string }).value;

const meta: Meta<typeof MultiComboboxField> = {
  title: 'components/MultiComboboxField',
  component: MultiComboboxField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    options: { control: 'object' },
  },
  args: {
    options,
    getOptionLabel,
    getOptionValue,
    placeholder: 'Select your favorite options',
    className: 'w-96',
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState(ctx.args.value);

      const onChange = (newValue: string[]): void => {
        ctx.args.onChange?.(newValue);
        setValue(newValue);
      };

      return (
        <Story
          args={{
            ...ctx.args,
            value: value ?? ctx.args.value ?? [],
            onChange,
          }}
        />
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'What are your favorite options?',
  description: 'We will never judge you for your choice.',
  error: 'Please select at least one option.',
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
  args: { ...states.Disabled, value: ['1', '2'] },
};
