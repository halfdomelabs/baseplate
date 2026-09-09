import type { Meta, StoryObj } from '@storybook/react-vite';

import { createFieldStates } from '#src/stories/field-states.js';

import { InputField } from './input-field.js';

const meta = {
  title: 'components/InputField',
  component: InputField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
  },
  args: {
    placeholder: 'foo@example.com',
  },
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Email address',
  description: 'We will never share your email with anyone else.',
  error: 'Enter a valid email address.',
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
  args: { ...states.Disabled, value: 'foo@example.com' },
};

/**
 * A field labelled by an element it does not own points at it with
 * `aria-labelledby` instead of rendering a `FieldLabel`. It is visually
 * identical to `DescriptionWithoutLabel` — the difference is only in the
 * accessibility tree.
 */
export const ExternalLabel: Story = {
  args: { description: 'We will never share your email with anyone else.' },
  render: (args) => (
    <div className="space-y-1.5">
      <h3 id="external-label" className="text-sm font-medium">
        Email address
      </h3>
      <InputField {...args} aria-labelledby="external-label" />
    </div>
  ),
};
