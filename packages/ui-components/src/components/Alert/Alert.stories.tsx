import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';

import type { IconElement } from '#src/types/react.js';

import { STORYBOOK_ICON_SELECT } from '#src/stories/button-icons.js';

import { Alert, AlertDescription, AlertTitle } from './Alert.js';

const variants = ['default', 'error', 'success', 'warning'] as const;

interface StoryProps {
  className?: string;
  icon?: IconElement;
  title?: string;
  description?: string;
  variant?: (typeof variants)[number] | null;
}

const meta = {
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    icon: STORYBOOK_ICON_SELECT,
    title: { control: 'text' },
    description: { control: 'text' },
    variant: {
      control: 'select',
      options: variants,
    },
  },
  args: {
    className: '',
    icon: undefined,
    title: 'This is an alert',
    description: 'Some description',
    variant: 'default',
  },
} satisfies Meta<StoryProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function AlertContainer({
  className,
  icon: Icon,
  title,
  description,
  variant,
}: StoryProps): React.JSX.Element {
  return (
    <Alert className={className} variant={variant}>
      {Icon && <Icon className="size-4" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export const Default: Story = {
  args: { children: null, variant: 'default' },
  render: (args) => <AlertContainer {...args} />,
};

export const Success: Story = {
  args: { children: null, variant: 'success' },
  render: (args) => <AlertContainer {...args} />,
};

export const Warning: Story = {
  args: { children: null, variant: 'warning' },
  render: (args) => <AlertContainer {...args} />,
};

export const Error: Story = {
  args: { children: null, variant: 'error' },
  render: (args) => <AlertContainer {...args} />,
};
