import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from '../label/label.js';
import { RadioGroup, RadioGroupItem } from './radio-group.js';

const meta = {
  title: 'components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: { type: 'boolean' } },
    className: { control: { type: 'text' } },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 'comfortable',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  args: {
    defaultValue: 'one',
    disabled: true,
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="one" id="d1" />
        <Label htmlFor="d1">Option one</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="two" id="d2" />
        <Label htmlFor="d2">Option two</Label>
      </div>
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  args: {
    defaultValue: 'a',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="i1" aria-invalid />
        <Label htmlFor="i1">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="i2" aria-invalid />
        <Label htmlFor="i2">Option B</Label>
      </div>
    </RadioGroup>
  ),
};
