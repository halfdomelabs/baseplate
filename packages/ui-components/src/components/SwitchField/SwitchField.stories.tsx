import type { Meta, StoryObj } from '@storybook/react';

import { SwitchField } from './SwitchField.js';

const meta = {
  component: SwitchField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
} satisfies Meta<typeof SwitchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Labelled: Story = {
  args: {
    label: 'Initiate Launch?',
    description: 'This is irreversible.',
  },
};
