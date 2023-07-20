import type { Meta, StoryObj } from '@storybook/react';
import { ToggleTabs } from './ToggleTabs.js';

const meta = {
  component: ToggleTabs,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ToggleTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 'tab-1',
    children: (
      <>
        <ToggleTabs.List>
          <ToggleTabs.Trigger value="tab-1">Tab 1</ToggleTabs.Trigger>
          <ToggleTabs.Trigger value="tab-2">Tab 2</ToggleTabs.Trigger>
          <ToggleTabs.Trigger value="tab-3">Tab 3</ToggleTabs.Trigger>
        </ToggleTabs.List>
        <ToggleTabs.Content value="tab-1">
          <h1>This is a panel 1</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </ToggleTabs.Content>
        <ToggleTabs.Content value="tab-2">
          <h1>This is a panel 2</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </ToggleTabs.Content>
        <ToggleTabs.Content value="tab-3">
          <h1>This is a panel 3</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </ToggleTabs.Content>
      </>
    ),
  },
};
