import type { Meta, StoryObj } from '@storybook/react';

import { SidebarTabs } from './SidebarTabs.js';

const meta = {
  component: SidebarTabs,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof SidebarTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <SidebarTabs defaultValue="default">
        <SidebarTabs.List>
          <SidebarTabs.Trigger value="default">Tab 1</SidebarTabs.Trigger>
          <SidebarTabs.Trigger value="not-default">Tab 2</SidebarTabs.Trigger>
          <SidebarTabs.Trigger value="tertiary">Tab 3</SidebarTabs.Trigger>
        </SidebarTabs.List>
        <SidebarTabs.Content value="default">
          <h1>This is the tab 1</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </SidebarTabs.Content>
        <SidebarTabs.Content value="not-default">
          <h1>This is the tab 2</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </SidebarTabs.Content>
        <SidebarTabs.Content value="tertiary">
          <h1>This is the tertiary tab</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </SidebarTabs.Content>
      </SidebarTabs>
    ),
  },
};
