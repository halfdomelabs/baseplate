import type { Meta, StoryObj } from '@storybook/react-vite';

import { Loader } from './loader.js';

const meta = {
  title: 'components/Loader',
  component: Loader,
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
