import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton.js';

const meta = {
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-12 h-12',
  },
};
