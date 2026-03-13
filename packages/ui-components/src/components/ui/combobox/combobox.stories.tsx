import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from './combobox.js';

const fruits = [
  'Apple',
  'Banana',
  'Cherry',
  'Grape',
  'Lemon',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Strawberry',
] as const;

const meta: Meta<typeof Combobox> = {
  title: 'components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Combobox items={fruits}>
        <ComboboxInput placeholder="Select a fruit" />
        <ComboboxContent>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
};

export const WithClear: Story = {
  render: () => (
    <div className="w-80">
      <Combobox items={fruits}>
        <ComboboxInput placeholder="Select a fruit" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Combobox items={fruits}>
        <ComboboxInput placeholder="Select a fruit" disabled />
        <ComboboxContent>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
};
