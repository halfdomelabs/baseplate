import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { RadioField } from './radio-field.js';

const meta: Meta<typeof RadioField> = {
  title: 'components/RadioField',
  component: RadioField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    options: { control: 'object' },
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
            value: value === undefined ? ctx.args.value : value,
            onChange,
          }}
        />
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const getOptionLabel = (option: unknown): string =>
  (option as { label: string }).label;
const getOptionValue = (option: unknown): string =>
  (option as { value: string }).value;

export const Default: Story = {
  args: {
    options,
    getOptionLabel,
    getOptionValue,
    className: 'w-96',
  },
};

export const Labelled: Story = {
  args: {
    options,
    label: 'What option would you like to select?',
    description: 'We will never judge you for your choice.',
    getOptionLabel,
    getOptionValue,
    className: 'w-96',
  },
};

export const Disabled: Story = {
  args: {
    options,
    label: 'What option would you like to select?',
    value: '2',
    disabled: true,
    getOptionLabel,
    getOptionValue,
    className: 'w-96',
  },
};

export const Invalid: Story = {
  args: {
    options,
    label: 'What option would you like to select?',
    error: 'Please select an option.',
    getOptionLabel,
    getOptionValue,
    className: 'w-96',
  },
};

/**
 * An empty field leaves every option unchecked. Radio options cannot carry a
 * `null` value, since that would be indistinguishable from no selection.
 */
export const NoSelection: Story = {
  args: {
    options,
    label: 'What option would you like to select?',
    value: null,
    getOptionLabel,
    getOptionValue,
    className: 'w-96',
  },
};
