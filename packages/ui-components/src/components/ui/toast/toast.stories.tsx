import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import type { ToastOptions } from './toast.js';

import { Button } from '../button/button.js';
import { toast } from './toast.js';

interface ToastProps {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'message';
  withAction?: boolean;
  onActionClick?: () => void;
}

function Toast({
  message,
  description,
  type = 'message',
  withAction,
  onActionClick,
}: ToastProps): React.JSX.Element {
  const onClick = (): void => {
    const options: ToastOptions = {
      description,
      actionProps: withAction
        ? {
            children: 'Undo',
            onClick:
              onActionClick ??
              ((): void => {
                /*noop*/
              }),
          }
        : undefined,
    };
    toast[type](message, options);
  };
  return (
    <Button variant="secondary" onClick={onClick}>
      Show toast
    </Button>
  );
}

const meta = {
  title: 'components/Toast',
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
    message: 'Could not save',
    description: 'Check your connection and try again.',
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

/** Fires three toasts so the collapsed stack, hover expansion and swipe-dismiss are all visible. */
export const Stacked: Story = {
  args: {
    message: 'This is a toast',
  },
  render: (args) => (
    <Button
      variant="secondary"
      onClick={() => {
        toast.success('Changes saved');
        toast.warning('Some fields were skipped');
        toast.error(args.message, {
          description: 'Check your connection and try again.',
        });
      }}
    >
      Show three toasts
    </Button>
  ),
};

/**
 * Shows the lifecycle helpers: a persistent toast that is later updated in
 * place, then dismissed.
 */
export const Updating: Story = {
  args: {
    message: 'Export queued',
  },
  render: (args) => {
    let id: string | undefined;
    return (
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            id = toast.message(args.message, { timeout: 0 });
          }}
        >
          Start
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (id) toast.update(id, { timeout: 0 });
          }}
        >
          Update timeout only
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (id)
              toast.update(id, {
                message: 'Export ready',
                description: 'Your download will begin shortly.',
                type: 'success',
              });
          }}
        >
          Resolve
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            toast.dismiss();
          }}
        >
          Dismiss all
        </Button>
      </div>
    );
  },
};
