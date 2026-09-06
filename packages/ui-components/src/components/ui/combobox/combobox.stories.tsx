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

/**
 * `size` goes on the input and the content, which are siblings under the root.
 * Popup options follow the content; the clear button follows the input group.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(['sm', 'default', 'xl'] as const).map((size) => (
        <Combobox key={size} items={fruits}>
          <ComboboxInput
            size={size}
            showClear
            placeholder={`Fruit (${size})`}
          />
          <ComboboxContent size={size}>
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
      ))}
    </div>
  ),
};
