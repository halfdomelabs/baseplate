import type { Meta, StoryObj } from '@storybook/react';

import { Switch } from './Switch.js';

const meta = {
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
