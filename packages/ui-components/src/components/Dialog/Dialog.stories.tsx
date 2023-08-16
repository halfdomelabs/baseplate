import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../index.js';
import { Dialog, DialogProps } from './Dialog.js';

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogContainer(
  args: Omit<DialogProps, 'children' | 'trigger'>
): JSX.Element {
  return (
    <Dialog {...args} trigger={<Button>Open Dialog</Button>}>
      <Dialog.Header>
        <Dialog.Title>Confirm delete</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to delete this file? This could indeed be a
          terrible idea.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Body>This is the body content</Dialog.Body>
      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Dialog.Close>
          <Button>Delete File</Button>
        </Dialog.Close>
      </Dialog.Footer>
    </Dialog>
  );
}

export const Default: Story = {
  args: { children: null, size: 'md' },
  render: (args) => <DialogContainer {...args} />,
};

function ControlledDialogContainer(
  args: Omit<DialogProps, 'children' | 'trigger' | 'isOpen'>
): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog {...args} isOpen={open} onOpenChange={(op) => setOpen(op)}>
        <Dialog.Header>
          <Dialog.Title>Confirm controlled delete</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete this file? This could indeed be a
            terrible idea.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>This is the body content</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button>Delete File</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog>
    </div>
  );
}

export const ControlledDialog: Story = {
  args: { children: null, isOpen: false, size: 'md' },
  render: (args) => <ControlledDialogContainer {...args} />,
};
