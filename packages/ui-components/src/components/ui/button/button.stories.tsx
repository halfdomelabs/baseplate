import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORYBOOK_ICON_SELECT } from '#src/stories/button-icons.js';

import { Button } from './button.js';

const meta = {
  title: 'components/Button',
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
        'ghostDestructive',
        'link',
        'linkDestructive',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'none'],
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

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Read the docs',
  },
};

/** The three destructive treatments, from strongest affordance to weakest. */
export const DestructiveVariants: Story = {
  args: { children: null },
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="destructive">Delete</Button>
      <Button variant="ghostDestructive">Delete</Button>
      <Button variant="linkDestructive">Delete</Button>
    </div>
  ),
};

export const Sizes: Story = {
  args: { children: null },
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const IconSizes: Story = {
  args: { children: null },
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="icon-xs" aria-label="Settings">
        <STORYBOOK_ICON_SELECT.mapping.Settings />
      </Button>
      <Button size="icon-sm" aria-label="Settings">
        <STORYBOOK_ICON_SELECT.mapping.Settings />
      </Button>
      <Button size="icon" aria-label="Settings">
        <STORYBOOK_ICON_SELECT.mapping.Settings />
      </Button>
      <Button size="icon-lg" aria-label="Settings">
        <STORYBOOK_ICON_SELECT.mapping.Settings />
      </Button>
    </div>
  ),
};
