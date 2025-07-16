import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './input.js';

const meta = {
  title: 'components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
