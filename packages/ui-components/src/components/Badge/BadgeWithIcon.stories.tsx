import type { Meta, StoryObj } from '@storybook/react';

import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';

import { Badge } from './Badge.js';

const meta = {
  title: 'Components/BadgeWithIcon',
  component: Badge.WithIcon,
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
    icon: STORYBOOK_ICON_SELECT.mapping.Plus,
  },
} satisfies Meta<typeof Badge.WithIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    icon: STORYBOOK_ICON_SELECT.mapping.Home,
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    icon: STORYBOOK_ICON_SELECT.mapping.Settings,
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    icon: STORYBOOK_ICON_SELECT.mapping.Power,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    icon: STORYBOOK_ICON_SELECT.mapping.Plus,
  },
};
