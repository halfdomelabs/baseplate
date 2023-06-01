import type { Meta, StoryObj } from '@storybook/react';
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiHome,
  HiCog6Tooth,
  HiPlus,
  HiPower,
} from 'react-icons/hi2';
import { Button } from './Button.js';

const ICONS = {
  None: undefined,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiHome,
  HiCog6Tooth,
  HiPlus,
  HiPower,
};

const iconSelect = {
  options: Object.keys(ICONS),
  mapping: ICONS,
  control: {
    type: 'select',
    labels: {
      HiOutlineChevronDown: 'Down',
      HiOutlineChevronUp: 'Up',
      HiOutlineChevronRight: 'Right',
      HiOutlineChevronLeft: 'Left',
      HiHome: 'Home',
      HiCog6Tooth: 'Settings',
      HiPlus: 'Plus',
      HiPower: 'Power',
    },
  },
};

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
    iconBefore: iconSelect,
    iconAfter: iconSelect,
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
