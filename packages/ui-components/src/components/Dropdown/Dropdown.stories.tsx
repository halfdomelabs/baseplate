import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown.js';

const meta = {
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    buttonLabel: 'Add User',
    children: (
      <>
        <Dropdown.ButtonItem>Admin</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>User</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>Boring User</Dropdown.ButtonItem>
      </>
    ),
  },
};

export const DropdownOnly: Story = {
  args: {
    children: (
      <>
        <Dropdown.ButtonItem>Admin</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>User</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>Boring User</Dropdown.ButtonItem>
      </>
    ),
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    buttonLabel: 'Add User',
    children: (
      <>
        <Dropdown.ButtonItem>Admin</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>User</Dropdown.ButtonItem>
        <Dropdown.ButtonItem>Boring User</Dropdown.ButtonItem>
      </>
    ),
  },
};
