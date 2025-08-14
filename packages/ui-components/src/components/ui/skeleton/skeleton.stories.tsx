import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from './skeleton.js';

const meta = {
  title: 'components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'h-4 w-[250px]',
  },
};

export const Card: Story = {
  args: {
    className: 'h-[200px] w-[350px] rounded-xl',
  },
};

export const Avatar: Story = {
  args: {
    className: 'h-12 w-12 rounded-full',
  },
};

export const Text: Story = {
  args: {
    className: 'h-4 w-full',
  },
};

export const MultipleLines: Story = {
  render: () => (
    <div className="space-y-3">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[300px]" />
    </div>
  ),
};

export const CardWithContent: Story = {
  render: () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};
