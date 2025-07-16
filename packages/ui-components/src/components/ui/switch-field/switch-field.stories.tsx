import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwitchField } from './switch-field.js';

const meta = {
  title: 'components/SwitchField',
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
