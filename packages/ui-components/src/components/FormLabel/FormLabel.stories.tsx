import type { Meta, StoryObj } from '@storybook/react';
import { FormLabel } from './FormLabel.js';

const meta = {
  component: FormLabel,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof FormLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Home address',
  },
};
