import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from './FormError.js';

const meta = {
  component: FormError,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof FormError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This field is required.',
  },
};
