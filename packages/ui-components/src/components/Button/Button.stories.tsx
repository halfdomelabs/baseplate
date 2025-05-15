import type { Meta, StoryObj } from '@storybook/react';

import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';

import { Button } from './Button.js';

const meta = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'ghost',
        'link',
      ],
    },
    children: {
      control: 'text',
      defaultValue: 'Click Me',
    },
    onClick: { table: { disable: true } },
  },
  args: {
    children: 'Click Me',
  },
} satisfies Meta<typeof Button>;

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

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: (
      <>
        <STORYBOOK_ICON_SELECT.mapping.Plus />
        Add Item
      </>
    ),
  },
};

export const WithRightIcon: Story = {
  args: {
    children: (
      <>
        Next
        <STORYBOOK_ICON_SELECT.mapping.Right />
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    children: <STORYBOOK_ICON_SELECT.mapping.Settings />,
    'aria-label': 'Settings',
  },
};
