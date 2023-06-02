import type { Meta, StoryObj } from '@storybook/react';
import { LinkButton } from './LinkButton.js';

const meta = {
  component: LinkButton,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click Me',
  },
};
