import type { Meta, StoryObj } from '@storybook/react';

import { MultiCombobox } from './MultiCombobox.js';

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
        <MultiCombobox.Input placeholder="Select your favorite fruits" />
        <MultiCombobox.Content>
          <MultiCombobox.Empty>No results found</MultiCombobox.Empty>
          <MultiCombobox.Group>
            <MultiCombobox.Item value="apple">Apple</MultiCombobox.Item>
            <MultiCombobox.Item value="banana">Banana</MultiCombobox.Item>
            <MultiCombobox.Item value="cherry">Cherry</MultiCombobox.Item>
            <MultiCombobox.Item value="grape">Grape</MultiCombobox.Item>
            <MultiCombobox.Item value="lemon">Lemon</MultiCombobox.Item>
            <MultiCombobox.Item value="orange">Orange</MultiCombobox.Item>
            <MultiCombobox.Item value="peach">Peach</MultiCombobox.Item>
            <MultiCombobox.Item value="pear">Pear</MultiCombobox.Item>
            <MultiCombobox.Item value="pineapple">Pineapple</MultiCombobox.Item>
            <MultiCombobox.Item value="plum">Plum</MultiCombobox.Item>
            <MultiCombobox.Item value="strawberry">
              Strawberry
            </MultiCombobox.Item>
            <MultiCombobox.Item value="tomato" disabled>
              Tomato
            </MultiCombobox.Item>
          </MultiCombobox.Group>
        </MultiCombobox.Content>
      </>
    ),
  },
};
