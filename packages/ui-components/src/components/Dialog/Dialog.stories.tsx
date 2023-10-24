import { DialogProps } from '@radix-ui/react-dialog';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../index.js';
import { Dialog } from './Dialog.js';

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogContainer(args: Omit<DialogProps, 'children'>): JSX.Element {
  return (
    <Dialog {...args}>
      <Dialog.Trigger asChild>
        <Button>Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Confirm delete</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete this file? This could indeed be a
            terrible idea.
          </Dialog.Description>
        </Dialog.Header>
        <p>This is the body content</p>
        <Dialog.Footer className="flex gap-4">
          <Dialog.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button>Delete File</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <DialogContainer {...args} />,
};

function ControlledDialogContainer(
  args: Omit<DialogProps, 'children' | 'open'>
): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog {...args} open={open} onOpenChange={(op) => setOpen(op)}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Confirm controlled delete</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete this file? This could indeed be a
              terrible idea.
            </Dialog.Description>
          </Dialog.Header>
          <p>This is the body content</p>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button>Delete File</Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export const ControlledDialog: Story = {
  args: { children: null, open: false },
  render: (args) => <ControlledDialogContainer {...args} />,
};
