import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';

import { Separator } from './separator.js';

const meta = {
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
  },
} satisfies Meta<typeof Separator>;

function SeparatorContainer(
  args: React.ComponentProps<typeof Separator>,
): React.JSX.Element {
  return (
    <div className="space-y-4">
      <p>This is some content</p>
      <Separator {...args} />
      <p>I&apos;m so far away</p>
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => <SeparatorContainer {...args} />,
};
