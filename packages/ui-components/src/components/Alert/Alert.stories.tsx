import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './Alert.js';
import { STORYBOOK_ICON_SELECT } from '@src/stories/button-icons.js';
import { IconElement } from '@src/types/react.js';

interface StoryProps {
  className?: string;
  icon?: IconElement;
  title?: string;
  description?: string;
}

const meta = {
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    icon: STORYBOOK_ICON_SELECT,
    title: { control: 'text', defaultValue: 'This is an alert' },
    description: { control: 'text', defaultValue: 'Some description' },
  },
} satisfies Meta<StoryProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function AlertContainer({
  className,
  icon: Icon,
  title,
  description,
}: StoryProps): JSX.Element {
  return (
    <Alert className={className}>
      {Icon && <Icon className="h-4 w-4" />}
      <Alert.Title>{title}</Alert.Title>
      <Alert.Description>{description}</Alert.Description>
    </Alert>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <AlertContainer {...args} />,
};
