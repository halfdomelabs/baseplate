import type { Meta, StoryObj } from '@storybook/react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './Select.js';

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
        <div className="w-80">
          <SelectTrigger>
            <SelectValue placeholder="Select something!" />
          </SelectTrigger>
        </div>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
            <SelectItem value="grape">Grape</SelectItem>
            <SelectItem value="lemon">Lemon</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="peach">Peach</SelectItem>
            <SelectItem value="pear">Pear</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
            <SelectItem value="plum">Plum</SelectItem>
            <SelectItem value="strawberry">Strawberry</SelectItem>
            <SelectItem value="tomato" disabled>
              Tomato
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </>
    ),
  },
};

export const Grouped: Story = {
  args: {
    children: (
      <>
        <SelectTrigger className="w-96">
          <SelectValue placeholder="Select a grouped item!" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value="option-1">Option 1</SelectItem>
            <SelectItem value="option-2">Option 2</SelectItem>
            <SelectItem value="option-3">Option 3</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Group 2</SelectLabel>
            <SelectItem value="option-4">Option 4</SelectItem>
            <SelectItem value="option-5">Option 5</SelectItem>
            <SelectItem value="option-6">Option 6</SelectItem>
          </SelectGroup>
        </SelectContent>
      </>
    ),
  },
};
