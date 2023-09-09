import type { Meta, StoryObj } from '@storybook/react';
import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';
import { Badge } from './Badge.js';

const meta = {
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      defaultValue: 'Relation',
    },
    icon: STORYBOOK_ICON_SELECT,
  },
  args: {
    children: 'Relation',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    color: 'primary',
  },
};

export const PrimaryWithClose: Story = {
  args: {
    color: 'primary',
    onClick: () => { /* no-op */ },
    onClose: () => { /* no-op */ },
  },
};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};
