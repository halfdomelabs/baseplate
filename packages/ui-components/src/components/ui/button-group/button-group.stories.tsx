import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button.js';
import { Input } from '../input/input.js';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from './button-group.js';

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

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    children: (
      <>
        <Button variant="outline">Top</Button>
        <Button variant="outline">Middle</Button>
        <Button variant="outline">Bottom</Button>
      </>
    ),
  },
};

export const WithSeparator: Story = {
  args: {
    children: (
      <>
        <Button variant="outline">Save</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">Save and close</Button>
      </>
    ),
  },
};

export const WithText: Story = {
  args: {
    children: (
      <>
        <ButtonGroupText>https://</ButtonGroupText>
        <Input placeholder="example.com" />
        <Button variant="outline">Copy</Button>
      </>
    ),
  },
};
