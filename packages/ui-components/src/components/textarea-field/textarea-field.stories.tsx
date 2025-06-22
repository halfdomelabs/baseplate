import type { Meta, StoryObj } from '@storybook/react';

import { TextareaField } from './textarea-field.js';

const meta = {
  component: TextareaField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your bio',
  },
};

export const Labelled: Story = {
  args: {
    label: 'Bio',
    description: 'Your detailed bio.',
    placeholder: 'Tell us about yourself',
  },
};
