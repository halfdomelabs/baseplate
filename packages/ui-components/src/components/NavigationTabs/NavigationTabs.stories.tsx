import type { Meta, StoryObj } from '@storybook/react';

import { NavigationTabs } from './NavigationTabs.js';

const meta = {
  component: NavigationTabs,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof NavigationTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <NavigationTabs.Item href="#test1" active={true}>
          Tab 1
        </NavigationTabs.Item>
        <NavigationTabs.Item href="#test2">Tab 2</NavigationTabs.Item>
        <NavigationTabs.Item href="#test3">Tab 3</NavigationTabs.Item>
      </>
    ),
  },
};
