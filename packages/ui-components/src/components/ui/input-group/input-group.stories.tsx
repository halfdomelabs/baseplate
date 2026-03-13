import type { Meta, StoryObj } from '@storybook/react-vite';

import { MdLink, MdMail, MdSearch, MdVisibility } from 'react-icons/md';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group.js';

const meta = {
  title: 'components/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Enter text..." />
    </InputGroup>
  ),
};

export const WithIconStart: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <MdSearch />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
};

export const WithIconEnd: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Enter email..." />
      <InputGroupAddon align="inline-end">
        <InputGroupText>
          <MdMail />
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTextAddon: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
};

export const WithButtonEnd: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <MdLink />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Enter URL..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>
          <MdVisibility />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithBothAddons: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="0.00" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupTextarea placeholder="Enter a message..." rows={3} />
    </InputGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <MdSearch />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Disabled input" disabled />
    </InputGroup>
  ),
};
