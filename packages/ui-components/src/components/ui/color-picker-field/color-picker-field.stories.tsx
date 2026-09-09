import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { createFieldStates } from '#src/stories/field-states.js';

import { ColorPickerField } from './color-picker-field.js';

const meta = {
  title: 'components/ColorPickerField',
  component: ColorPickerField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Pick a color',
    disabled: false,
  },
  render: function ColorPickerFieldStory(args) {
    const [color, setColor] = useState<string | undefined>(args.value);
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
} satisfies Meta<typeof ColorPickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Brand color',
  description: 'Choose a color for your brand identity.',
  error: 'Color is required.',
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
  args: { ...states.Disabled, value: '#3b82f6' },
};

export const Preselected: Story = {
  args: { label: 'Theme color', value: '#3b82f6' },
};
