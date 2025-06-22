import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import type { ExternalToast } from 'sonner';

import { toast } from 'sonner';

import { Button } from '../button/button.js';

interface ToastProps {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'message';
  withAction?: boolean;
  withCancel?: boolean;
  onActionClick?: () => void;
}

function Toast({
  message,
  description,
  type = 'message',
  withAction,
  onActionClick,
  withCancel,
}: ToastProps): React.JSX.Element {
  const onClick = (): void => {
    const payload: ExternalToast = {
      description,
      action: withAction
        ? {
            label: 'Undo',
            onClick:
              onActionClick ??
              (() => {
                /*noop*/
              }),
          }
        : undefined,
      cancel: withCancel
        ? {
            label: 'Cancel',
            onClick: () => {
              /*noop*/
            },
          }
        : undefined,
    };
    toast[type](message, payload);
  };
  return (
    <Button variant="secondary" onClick={onClick}>
      Show toast
    </Button>
  );
}

const meta = {
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    type: {
      options: ['success', 'error', 'warning', 'message'],
      control: { type: 'radio' },
    },
  },
} satisfies Meta<ToastProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This is a toast',
  },
};

export const WithDescription: Story = {
  args: {
    message: 'This is a toast',
    description: 'This is a description',
  },
};

export const WithSuccess: Story = {
  args: {
    message: 'This is a toast',
    type: 'success',
  },
};

export const WithError: Story = {
  args: {
    message: 'This is a toast',
    type: 'error',
  },
};

export const WithWarning: Story = {
  args: {
    message: 'This is a toast',
    type: 'warning',
  },
};

export const WithAction: Story = {
  args: {
    message: 'This is a toast',
    withAction: true,
  },
};

export const WithCancel: Story = {
  args: {
    message: 'This is a toast',
    withCancel: true,
  },
};
