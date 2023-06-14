import type { Meta, StoryObj } from '@storybook/react';
import { FormDescription } from './FormDescription.js';

const meta = {
  component: FormDescription,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof FormDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Must be least 8 characters long.',
  },
};
