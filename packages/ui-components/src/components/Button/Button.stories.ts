import type { Meta, StoryObj } from '@storybook/react';
import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';
import { Button } from './Button.js';

const meta = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
    },
    children: {
      control: 'text',
      defaultValue: 'Click Me',
    },
    onClick: { table: { disable: true } },
    iconBefore: STORYBOOK_ICON_SELECT,
    iconAfter: STORYBOOK_ICON_SELECT,
  },
  args: {
    children: 'Click Me',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
  },
};
