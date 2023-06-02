import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput.js';

const meta = {
  component: TextInput,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
  },
};
