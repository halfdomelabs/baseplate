import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { NumberField } from './number-field.js';

const meta: Meta<typeof NumberField> = {
  title: 'components/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState(ctx.args.value);

      const onChange = (newValue: number | null): void => {
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

export const Default: Story = {
  args: {
    className: 'w-96',
  },
};

export const Labelled: Story = {
  args: {
    label: 'How many items would you like?',
    description: 'Clearing the field submits an empty value.',
    className: 'w-96',
  },
};

export const WithBounds: Story = {
  args: {
    label: 'Quantity',
    description: 'Between 0 and 10.',
    min: 0,
    max: 10,
    value: 5,
    className: 'w-96',
  },
};

export const Decimal: Story = {
  args: {
    label: 'Price',
    step: 0.01,
    value: 19.99,
    className: 'w-96',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Quantity',
    value: 3,
    disabled: true,
    className: 'w-96',
  },
};

export const Invalid: Story = {
  args: {
    label: 'Quantity',
    error: 'Please enter a quantity.',
    className: 'w-96',
  },
};
