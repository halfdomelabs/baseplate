import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import { useState } from 'react';

import { Button, ComboboxField } from '../index.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog.js';

const meta = {
  title: 'components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogContainer(
  args: Omit<React.ComponentProps<typeof Dialog>, 'children'>,
): React.JSX.Element {
  return (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this file? This could indeed be a
            terrible idea.
          </DialogDescription>
        </DialogHeader>
        <p>This is the body content</p>
        <ComboboxField
          label="Select a file"
          options={[
            { label: 'File 1', value: 'file1' },
            { label: 'File 2', value: 'file2' },
            { label: 'File 3', value: 'file3' },
            { label: 'File 3', value: 'file4' },
            { label: 'File 3', value: 'file5' },
            { label: 'File 3', value: 'file6' },
            { label: 'File 3', value: 'file7' },
            { label: 'File 3', value: 'file8' },
            { label: 'File 3', value: 'file9' },
            { label: 'File 3', value: 'file10' },
            { label: 'File 3', value: 'file11' },
            { label: 'File 3', value: 'file12' },
            { label: 'File 3', value: 'file13' },
            { label: 'File 3', value: 'file14' },
          ]}
          getOptionLabel={(option) => option.label}
        />
        <DialogFooter className="flex gap-4">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Delete File</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <DialogContainer {...args} />,
};

function ControlledDialogContainer(
  args: Omit<React.ComponentProps<typeof Dialog>, 'children' | 'open'>,
): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open dialog
      </Button>
      <Dialog
        {...args}
        open={open}
        onOpenChange={(op) => {
          setOpen(op);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm controlled delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This could indeed be a
              terrible idea.
            </DialogDescription>
          </DialogHeader>
          <p>This is the body content</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Delete File</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ControlledDialog: Story = {
  args: { children: null, open: false },
  render: (args) => <ControlledDialogContainer {...args} />,
};
