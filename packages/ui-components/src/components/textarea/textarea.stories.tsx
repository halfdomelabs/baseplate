import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './textarea.js';

const meta = {
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
