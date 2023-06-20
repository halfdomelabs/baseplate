import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from '../Dropdown/Dropdown.js';
import { ButtonGroup } from './ButtonGroup.js';

const meta = {
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
        <ButtonGroup.Button>Add Something</ButtonGroup.Button>
        <ButtonGroup.Button>Remove Something</ButtonGroup.Button>
        <ButtonGroup.Button>Remove Something</ButtonGroup.Button>
      </>
    ),
  },
};

export const Secondary: Story = {
  args: {
    children: (
      <>
        <ButtonGroup.Button variant="secondary">
          Add Something
        </ButtonGroup.Button>
        <ButtonGroup.Button variant="secondary">
          Remove Something
        </ButtonGroup.Button>
        <ButtonGroup.Dropdown variant="secondary">
          <Dropdown.ButtonItem>Admin</Dropdown.ButtonItem>
          <Dropdown.ButtonItem>User</Dropdown.ButtonItem>
        </ButtonGroup.Dropdown>
      </>
    ),
  },
};
