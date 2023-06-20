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
      <>
        <Tabs.List>
          <Tabs.Tab>Tab 1</Tabs.Tab>
          <Tabs.Tab>Tab 2</Tabs.Tab>
          <Tabs.Tab>Tab 3</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel>
            <h1>This is a panel 1</h1>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
              voluptatum minima id nobis soluta nisi error.
            </p>
          </Tabs.Panel>
          <Tabs.Panel>
            <h1>This is a panel 2</h1>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
              voluptatum minima id nobis soluta nisi error.
            </p>
          </Tabs.Panel>
          <Tabs.Panel>
            <h1>This is a panel 3</h1>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
              voluptatum minima id nobis soluta nisi error.
            </p>
          </Tabs.Panel>
        </Tabs.Panels>
      </>
    ),
  },
};
