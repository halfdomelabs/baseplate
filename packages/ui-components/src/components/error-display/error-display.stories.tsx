import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorDisplay } from './error-display.js';

const meta = {
  title: 'components/ErrorDisplay',
  component: ErrorDisplay,
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: {
        type: 'text',
      },
    },
  },
} satisfies Meta<typeof ErrorDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewError: Story = {
  args: {
    error: new Error('This is an error'),
  },
};
