import type { Meta, StoryObj } from '@storybook/react';

import {
  MultiCombobox,
  MultiComboboxContent,
  MultiComboboxEmpty,
  MultiComboboxGroup,
  MultiComboboxInput,
  MultiComboboxItem,
} from './MultiCombobox.js';

const meta: Meta<typeof MultiCombobox> = {
  component: MultiCombobox,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <MultiComboboxInput placeholder="Select your favorite fruits" />
        <MultiComboboxContent>
          <MultiComboboxEmpty>No results found</MultiComboboxEmpty>
          <MultiComboboxGroup>
            <MultiComboboxItem value="apple">Apple</MultiComboboxItem>
            <MultiComboboxItem value="banana">Banana</MultiComboboxItem>
            <MultiComboboxItem value="cherry">Cherry</MultiComboboxItem>
            <MultiComboboxItem value="grape">Grape</MultiComboboxItem>
            <MultiComboboxItem value="lemon">Lemon</MultiComboboxItem>
            <MultiComboboxItem value="orange">Orange</MultiComboboxItem>
            <MultiComboboxItem value="peach">Peach</MultiComboboxItem>
            <MultiComboboxItem value="pear">Pear</MultiComboboxItem>
            <MultiComboboxItem value="pineapple">Pineapple</MultiComboboxItem>
            <MultiComboboxItem value="plum">Plum</MultiComboboxItem>
            <MultiComboboxItem value="strawberry">Strawberry</MultiComboboxItem>
            <MultiComboboxItem value="tomato" disabled>
              Tomato
            </MultiComboboxItem>
          </MultiComboboxGroup>
        </MultiComboboxContent>
      </>
    ),
  },
};
