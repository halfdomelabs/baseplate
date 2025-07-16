import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './label.js';

const meta = {
  title: 'components/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    children: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a label',
  },
};
