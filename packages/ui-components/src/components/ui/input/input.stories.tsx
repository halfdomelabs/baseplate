import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './input.js';

const meta = {
  title: 'components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    className: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    height: { control: 'inline-radio', options: ['default', 'flexible'] },
    background: {
      control: 'inline-radio',
      options: ['default', 'transparent'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Cannot edit' },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'Not a valid value' },
};

/**
 * `background="transparent"` is for inputs whose parent paints the fill, such
 * as the control inside an `InputGroup`.
 */
export const Transparent: Story = {
  args: { background: 'transparent', placeholder: 'Parent paints the fill' },
};

/** `height="flexible"` lets the control grow past its default height. */
export const Flexible: Story = {
  args: { height: 'flexible', placeholder: 'Grows with its content' },
};
