import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { ComboboxField } from './combobox-field.js';

const meta: Meta<typeof ComboboxField> = {
  title: 'components/ComboboxField',
  component: ComboboxField,
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
    options: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ],
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
    className: 'w-96',
  },
};

export const Labelled: Story = {
  args: {
    options: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ],
    label: 'What option would you like to combobox?',
    description: 'We will never judge you for your choice.',
    getOptionLabel: (option) => (option as { label: string }).label,
    getOptionValue: (option) => (option as { value: string }).value,
    className: 'w-96',
  },
};
