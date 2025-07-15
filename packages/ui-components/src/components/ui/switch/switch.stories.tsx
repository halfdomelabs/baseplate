import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './switch.js';

const meta = {
  title: 'components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
