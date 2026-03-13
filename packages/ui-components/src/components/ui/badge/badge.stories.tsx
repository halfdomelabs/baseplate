import type { Meta, StoryObj } from '@storybook/react-vite';

import { MdHome, MdSettings, MdStar } from 'react-icons/md';

import { Badge } from './badge.js';

const meta = {
  title: 'components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      defaultValue: 'Badge',
    },
  },
  args: {
    children: 'Badge',
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

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'secondary',
    children: (
      <>
        <MdStar />
        Unique
      </>
    ),
  },
};

export const WithIconDefault: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <MdHome />
        Home
      </>
    ),
  },
};

export const WithIconDestructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <MdSettings />
        Settings
      </>
    ),
  },
};

export const AsLink: Story = {
  render: (args) => (
    <Badge {...args} render={<a href="https://example.com" />}>
      Link Badge
    </Badge>
  ),
  args: {
    variant: 'default',
  },
};

export const AsLinkSecondary: Story = {
  render: (args) => (
    <Badge {...args} render={<a href="https://example.com" />}>
      Link Badge
    </Badge>
  ),
  args: {
    variant: 'secondary',
  },
};

export const AsLinkWithIcon: Story = {
  render: (args) => (
    <Badge {...args} render={<a href="https://example.com" />}>
      <MdHome />
      Link with Icon
    </Badge>
  ),
  args: {
    variant: 'outline',
  },
};
