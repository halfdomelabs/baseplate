import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { ColorPickerField } from './color-picker-field.js';

const meta = {
  title: 'components/ColorPickerField',
  component: ColorPickerField,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Pick a color',
    disabled: false,
  },
} satisfies Meta<typeof ColorPickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => {
    const [color, setColor] = useState<string | undefined>();
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Brand Color',
  },
  render: (args) => {
    const [color, setColor] = useState<string | undefined>();
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
};

export const WithError: Story = {
  args: {
    label: 'Brand Color',
    error: 'Color is required',
  },
  render: (args) => {
    const [color, setColor] = useState<string | undefined>();
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Brand Color',
    description: 'Choose a color for your brand identity',
  },
  render: (args) => {
    const [color, setColor] = useState<string | undefined>();
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
};

export const Preselected: Story = {
  args: {
    label: 'Theme Color',
  },
  render: (args) => {
    const [color, setColor] = useState<string | undefined>('#3b82f6');
    return <ColorPickerField {...args} value={color} onChange={setColor} />;
  },
};
