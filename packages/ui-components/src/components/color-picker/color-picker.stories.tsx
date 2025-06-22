import type { Meta, StoryObj } from '@storybook/react';

import { ColorPicker } from './color-picker.js';

const meta = {
  component: ColorPicker,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
