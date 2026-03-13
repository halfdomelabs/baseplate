import type { Meta, StoryObj } from '@storybook/react-vite';

import { NavigationTabs, NavigationTabsItem } from './navigation-tabs.js';

const meta = {
  title: 'components/NavigationTabs',
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
        <NavigationTabsItem render={<a href="#test1" />} active={true}>
          Tab 1
        </NavigationTabsItem>
        <NavigationTabsItem render={<a href="#test2" />}>
          Tab 2
        </NavigationTabsItem>
        <NavigationTabsItem render={<a href="#test3" />}>
          Tab 3
        </NavigationTabsItem>
      </>
    ),
  },
};
