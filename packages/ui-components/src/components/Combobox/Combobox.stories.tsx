import type { Meta, StoryObj } from '@storybook/react';

import { Combobox } from './Combobox.js';

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
          <Combobox.Input placeholder="Select a fruit" />
        </div>
        <Combobox.Content>
          <Combobox.Empty>No results found</Combobox.Empty>
          <Combobox.Group>
            <Combobox.Item value="apple">Apple</Combobox.Item>
            <Combobox.Item value="banana">Banana</Combobox.Item>
            <Combobox.Item value="cherry">Cherry</Combobox.Item>
            <Combobox.Item value="grape">Grape</Combobox.Item>
            <Combobox.Item value="lemon">Lemon</Combobox.Item>
            <Combobox.Item value="orange">Orange</Combobox.Item>
            <Combobox.Item value="peach">Peach</Combobox.Item>
            <Combobox.Item value="pear">Pear</Combobox.Item>
            <Combobox.Item value="pineapple">Pineapple</Combobox.Item>
            <Combobox.Item value="plum">Plum</Combobox.Item>
            <Combobox.Item value="strawberry">Strawberry</Combobox.Item>
            <Combobox.Item value="tomato" disabled>
              Tomato
            </Combobox.Item>
          </Combobox.Group>
        </Combobox.Content>
      </>
    ),
  },
};
