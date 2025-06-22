import type { Meta, StoryObj } from '@storybook/react';

import { Loader } from './loader.js';

const meta = {
  component: Loader,
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
