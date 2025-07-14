import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from './textarea.js';

const meta = {
  title: 'components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
