import type { Meta, StoryObj } from '@storybook/react';

import { InputField } from './InputField.js';

const meta = {
  component: InputField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
  },
};

export const Labelled: Story = {
  args: {
    label: 'Email address',
    description: 'We will never share your email with anyone else.',
    placeholder: 'foo@example.com',
  },
};
