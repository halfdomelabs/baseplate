import type { Meta, StoryObj } from '@storybook/react';

import { ErrorableLoader } from './errorable-loader.js';

const meta = {
  component: ErrorableLoader,
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof ErrorableLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Errored: Story = {
  args: {
    error: new Error('This is an error'),
  },
};
