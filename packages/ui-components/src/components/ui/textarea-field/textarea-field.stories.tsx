import type { Meta, StoryObj } from '@storybook/react-vite';

import { createFieldStates } from '#src/stories/field-states.js';

import { TextareaField } from './textarea-field.js';

const meta = {
  title: 'components/TextareaField',
  component: TextareaField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
  args: {
    placeholder: 'Tell us about yourself',
  },
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Bio',
  description: 'Your detailed bio.',
  error: 'Enter at least 20 characters.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = {
  args: { ...states.Disabled, value: 'This field is disabled.' },
};
