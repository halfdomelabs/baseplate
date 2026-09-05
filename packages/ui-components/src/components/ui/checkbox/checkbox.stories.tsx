import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './checkbox.js';

const meta = {
  title: 'components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true },
};

/**
 * The unchecked box fills with `bg-control-background`, so it stays legible on
 * a card as well as on the page. Switch the Palette toolbar to "stress" to see
 * the two surfaces resolve differently.
 */
export const States: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox />
      <Checkbox defaultChecked />
      <Checkbox indeterminate />
      <Checkbox disabled />
      <Checkbox disabled defaultChecked />
    </div>
  ),
};
