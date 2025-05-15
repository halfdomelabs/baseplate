import type { Meta, StoryObj } from '@storybook/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs.js';

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
        <TabsList>
          <TabsTrigger value="default">Tab 1</TabsTrigger>
          <TabsTrigger value="not-default">Tab 2</TabsTrigger>
          <TabsTrigger value="tertiary">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="default">
          <h1>This is the tab 1</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </TabsContent>
        <TabsContent value="not-default">
          <h1>This is the tab 2</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </TabsContent>
        <TabsContent value="tertiary">
          <h1>This is the tertiary tab</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </TabsContent>
      </Tabs>
    ),
  },
};
