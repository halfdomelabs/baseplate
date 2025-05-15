import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../Button/Button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './Tooltip.js';

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <TooltipTrigger>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
        </TooltipContent>
      </>
    ),
  },
};
