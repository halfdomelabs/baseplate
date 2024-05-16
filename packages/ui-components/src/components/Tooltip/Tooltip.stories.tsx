import type { Meta, StoryObj } from '@storybook/react';

import { Tooltip } from './Tooltip.js';
import { Button } from '../Button/Button.js';

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (Story) => (
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Tooltip.Trigger>
          <Button variant="outline">Hover me</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
        </Tooltip.Content>
      </>
    ),
  },
};
