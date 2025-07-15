import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmptyDisplay } from './empty-display.js';

const meta = {
  title: 'components/EmptyDisplay',
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
