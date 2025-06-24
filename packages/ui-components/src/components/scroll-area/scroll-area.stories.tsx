import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';

import { Separator } from '../separator/separator.js';
import { ScrollArea } from './scroll-area.js';

const meta = {
  component: ScrollArea,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
);

function ScrollAreaContainer(
  args: Omit<React.ComponentProps<typeof ScrollArea>, 'children'>,
): React.JSX.Element {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border" {...args}>
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
        {tags.map((tag, i) => (
          <>
            <div key={tag} className="text-sm">
              {tag}
            </div>
            {i !== tags.length - 1 && <Separator className="my-2" />}
          </>
        ))}
      </div>
    </ScrollArea>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <ScrollAreaContainer {...args} />,
};
