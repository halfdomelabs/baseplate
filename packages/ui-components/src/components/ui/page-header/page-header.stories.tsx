import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button.js';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
} from './page-header.js';

const meta = {
  title: 'components/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>URL Configuration</PageHeaderTitle>
      <PageHeaderDescription>
        Configure the public URLs each app is served from. These are used
        whenever the backend mints an absolute link.
      </PageHeaderDescription>
    </PageHeader>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>Project settings</PageHeaderTitle>
    </PageHeader>
  ),
};

export const WithActions: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>Manage Plugins</PageHeaderTitle>
      <PageHeaderDescription>
        Plugins extend your project with authentication, storage, queues and
        more.
      </PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="secondary">Refresh</Button>
        <Button>Add plugin</Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/**
 * The sticky border-bottom treatment used across the settings routes lives at
 * the call site, not in the component.
 */
export const Sticky: Story = {
  render: () => (
    <div className="h-64 overflow-y-auto">
      <div className="sticky top-0 border-b bg-background py-6">
        <PageHeader>
          <PageHeaderTitle>Monorepo Configuration</PageHeaderTitle>
          <PageHeaderDescription>
            Configure the folder structure for your monorepo packages.
          </PageHeaderDescription>
        </PageHeader>
      </div>
      <div className="space-y-4 py-4 text-sm text-muted-foreground">
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i}>Scroll to see the header stick.</p>
        ))}
      </div>
    </div>
  ),
};
