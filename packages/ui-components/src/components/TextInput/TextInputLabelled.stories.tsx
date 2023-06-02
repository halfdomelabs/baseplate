import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput.js';

const meta = {
  component: TextInput.Labelled,
  title: 'Components/TextInput/Labelled',
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    subtext: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
} satisfies Meta<typeof TextInput.Labelled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email address',
    error: 'This field is required.',
    placeholder: 'foo@example.com',
  },
};
