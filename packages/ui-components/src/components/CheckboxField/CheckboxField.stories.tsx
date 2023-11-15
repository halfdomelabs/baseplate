import type { Meta, StoryObj } from '@storybook/react';

import { CheckboxField } from './CheckboxField.js';

const meta = {
  component: CheckboxField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
} satisfies Meta<typeof CheckboxField>;

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

export const LabelledWithError: Story = {
  args: {
    label: 'Initiate Launch?',
    description: 'This is irreversible.',
    error: 'Failure to launch',
  },
};
