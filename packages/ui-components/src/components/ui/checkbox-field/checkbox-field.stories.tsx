import type { Meta, StoryObj } from '@storybook/react-vite';

import { createFieldStates } from '#src/stories/field-states.js';

import { CheckboxField } from './checkbox-field.js';

const meta = {
  title: 'components/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
  },
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Initiate launch?',
  description: 'This is irreversible.',
  error: 'Failure to launch.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = { args: { ...states.Disabled, value: true } };
