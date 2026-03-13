import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import { useState } from 'react';

import { Button } from '../button/button.js';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../combobox/combobox.js';
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
      <DialogTrigger render={<Button />}>Open Dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this file? This could indeed be a
            terrible idea.
          </DialogDescription>
        </DialogHeader>
        <p>This is the body content</p>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button />}>Delete File</DialogClose>
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
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <DialogClose render={<Button />}>Delete File</DialogClose>
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

const loremParagraph =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export const LongContent: Story = {
  args: { children: null },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open Long Dialog</DialogTrigger>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms carefully before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>{loremParagraph}</p>
          <p>{loremParagraph}</p>
          <p>{loremParagraph}</p>
          <p>{loremParagraph}</p>
          <p>{loremParagraph}</p>
          <p>{loremParagraph}</p>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
};

const fruits = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Grape', value: 'grape' },
  { label: 'Orange', value: 'orange' },
  { label: 'Pear', value: 'pear' },
  { label: 'Strawberry', value: 'strawberry' },
];

export const WithFormFields: Story = {
  args: { children: null },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open Form Dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new item</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <Combobox items={fruits}>
              <ComboboxInput placeholder="Search fruits..." />
              <ComboboxContent>
                <ComboboxEmpty>No results found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: (typeof fruits)[number]) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
