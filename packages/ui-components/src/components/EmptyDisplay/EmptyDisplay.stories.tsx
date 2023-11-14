import type { Meta, StoryObj } from '@storybook/react';

import { EmptyDisplay } from './EmptyDisplay.js';

const meta = {
  component: EmptyDisplay,
  tags: ['autodocs'],
  argTypes: {
    subtitle: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof EmptyDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
