import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs.js';

const meta = {
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Tabs defaultValue="default">
        <Tabs.List>
          <Tabs.Trigger value="default">Default</Tabs.Trigger>
          <Tabs.Trigger value="not-default">Secondary</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="default">
          <h1>This is the default tab</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </Tabs.Content>
        <Tabs.Content value="not-default">
          <h1>This is the secondary tab</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </Tabs.Content>
      </Tabs>
    ),
  },
};
