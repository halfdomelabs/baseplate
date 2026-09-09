import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { createFieldStates } from '#src/stories/field-states.js';

import { NumberField } from './number-field.js';

const meta: Meta<typeof NumberField> = {
  title: 'components/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
  args: {
    className: 'w-96',
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

const states = createFieldStates({
  label: 'Quantity',
  description: 'Clearing the field submits an empty value.',
  error: 'Please enter a quantity.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = { args: { ...states.Disabled, value: 3 } };

export const WithBounds: Story = {
  args: {
    label: 'Quantity',
    description: 'Between 0 and 10.',
    min: 0,
    max: 10,
    value: 5,
  },
};

export const Decimal: Story = {
  args: { label: 'Price', step: 0.01, value: 19.99 },
};
