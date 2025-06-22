import type { Meta, StoryObj } from '@storybook/react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from './combobox.js';

const meta: Meta<typeof Combobox> = {
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <div className="w-80">
          <ComboboxInput placeholder="Select a fruit" />
        </div>
        <ComboboxContent>
          <ComboboxEmpty>No results found</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxItem value="apple">Apple</ComboboxItem>
            <ComboboxItem value="banana">Banana</ComboboxItem>
            <ComboboxItem value="cherry">Cherry</ComboboxItem>
            <ComboboxItem value="grape">Grape</ComboboxItem>
            <ComboboxItem value="lemon">Lemon</ComboboxItem>
            <ComboboxItem value="orange">Orange</ComboboxItem>
            <ComboboxItem value="peach">Peach</ComboboxItem>
            <ComboboxItem value="pear">Pear</ComboboxItem>
            <ComboboxItem value="pineapple">Pineapple</ComboboxItem>
            <ComboboxItem value="plum">Plum</ComboboxItem>
            <ComboboxItem value="strawberry">Strawberry</ComboboxItem>
            <ComboboxItem value="tomato" disabled>
              Tomato
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxContent>
      </>
    ),
  },
};
