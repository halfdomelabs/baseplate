import type { Meta, StoryObj } from '@storybook/react';
import { CheckedInput } from './CheckedInput.js';

const meta = {
  component: CheckedInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
} satisfies Meta<typeof CheckedInput>;

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

export const HorizontalLabelled: Story = {
  args: {
    label: 'Initiate Launch?',
    description: 'This is irreversible.',
    horizontalLabel: true,
  },
};
