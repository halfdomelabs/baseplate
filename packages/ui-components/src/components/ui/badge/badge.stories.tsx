import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './badge.js';

const meta = {
  title: 'components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      defaultValue: 'Relation',
    },
  },
  args: {
    children: 'Relation',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};
