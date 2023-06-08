import type { Meta, StoryObj } from '@storybook/react';
import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';
import { NavigationLink } from './NavigationLink.js';

const meta = {
  component: NavigationLink,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      defaultValue: 'Click Me',
    },
    icon: STORYBOOK_ICON_SELECT,
  },
  args: {
    children: 'Click Me',
    href: '#',
  },
} satisfies Meta<typeof NavigationLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
