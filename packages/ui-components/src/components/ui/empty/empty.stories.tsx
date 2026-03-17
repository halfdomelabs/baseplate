import type { Meta, StoryObj } from '@storybook/react-vite';

import { MdInbox, MdSearch } from 'react-icons/md';

import { Button } from '../button/button.js';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty.js';

const meta = {
  title: 'components/Empty',
  component: Empty,
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (): React.ReactElement => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MdInbox />
        </EmptyMedia>
        <EmptyTitle>No items found</EmptyTitle>
        <EmptyDescription>
          There are no items to display right now.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create New Item</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const Minimal: Story = {
  render: (): React.ReactElement => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Nothing here yet</EmptyTitle>
        <EmptyDescription>
          Get started by creating your first item.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithLargeIcon: Story = {
  render: (): React.ReactElement => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <MdSearch className="size-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filter to find what you&apos;re looking
          for.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
