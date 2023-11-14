import type { Meta, StoryObj } from '@storybook/react';

import { Select } from './Select.js';

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    open: { control: { type: 'boolean' } },
    disabled: { control: { type: 'boolean' } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Select.Trigger>
          <Select.Value placeholder="Select something!" />
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Item value="apple">Apple</Select.Item>
            <Select.Item value="banana">Banana</Select.Item>
            <Select.Item value="cherry">Cherry</Select.Item>
            <Select.Item value="grape">Grape</Select.Item>
            <Select.Item value="lemon">Lemon</Select.Item>
            <Select.Item value="orange">Orange</Select.Item>
            <Select.Item value="peach">Peach</Select.Item>
            <Select.Item value="pear">Pear</Select.Item>
            <Select.Item value="pineapple">Pineapple</Select.Item>
            <Select.Item value="plum">Plum</Select.Item>
            <Select.Item value="strawberry">Strawberry</Select.Item>
            <Select.Item value="tomato" disabled>
              Tomato
            </Select.Item>
          </Select.Group>
        </Select.Content>
      </>
    ),
  },
};

export const Grouped: Story = {
  args: {
    children: (
      <>
        <Select.Trigger className="w-96">
          <Select.Value placeholder="Select a grouped item!" />
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Label>Group 1</Select.Label>
            <Select.Item value="option-1">Option 1</Select.Item>
            <Select.Item value="option-2">Option 2</Select.Item>
            <Select.Item value="option-3">Option 3</Select.Item>
          </Select.Group>
          <Select.Group>
            <Select.Label>Group 2</Select.Label>
            <Select.Item value="option-4">Option 4</Select.Item>
            <Select.Item value="option-5">Option 5</Select.Item>
            <Select.Item value="option-6">Option 6</Select.Item>
          </Select.Group>
        </Select.Content>
      </>
    ),
  },
};
