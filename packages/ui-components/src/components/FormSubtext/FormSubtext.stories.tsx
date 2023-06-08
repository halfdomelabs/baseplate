import type { Meta, StoryObj } from '@storybook/react';
import { FormSubtext } from './FormSubtext.js';

const meta = {
  component: FormSubtext,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof FormSubtext>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Must be least 8 characters long.',
  },
};
