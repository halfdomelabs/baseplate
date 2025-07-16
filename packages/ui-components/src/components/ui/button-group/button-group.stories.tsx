import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button.js';
import { ButtonGroup } from './button-group.js';

const meta = {
  title: 'components/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Button>Add Something</Button>
        <Button>Remove Something</Button>
        <Button>Remove Something</Button>
      </>
    ),
  },
};

export const Secondary: Story = {
  args: {
    children: (
      <>
        <Button variant="secondary">Add Something</Button>
        <Button variant="secondary">Remove Something</Button>
      </>
    ),
  },
};
