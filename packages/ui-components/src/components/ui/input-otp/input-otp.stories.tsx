import type { Meta, StoryObj } from '@storybook/react-vite';

import { InputOtpField } from './input-otp.js';

const meta = {
  title: 'components/InputOtpField',
  component: InputOtpField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    length: { control: { type: 'number' } },
    showSeparator: { control: { type: 'boolean' } },
  },
} satisfies Meta<typeof InputOtpField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Verification code',
  },
};

export const Labelled: Story = {
  args: {
    label: 'Verification code',
    description: 'Enter the 6-digit code we emailed you.',
  },
};

export const WithSeparator: Story = {
  args: {
    label: 'Verification code',
    showSeparator: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Verification code',
    description: 'Enter the 6-digit code we emailed you.',
    error: 'That code is incorrect or has expired',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Verification code',
    defaultValue: '123456',
    disabled: true,
  },
};

export const Masked: Story = {
  args: {
    label: 'PIN',
    defaultValue: '1234',
    length: 4,
    mask: true,
  },
};

export const FourDigits: Story = {
  args: {
    label: 'PIN',
    length: 4,
  },
};
